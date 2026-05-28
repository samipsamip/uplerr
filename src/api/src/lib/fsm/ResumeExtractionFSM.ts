/**
 * Resume Extraction FSM
 *
 * Drives a resume file through validation, LLM extraction, and cloud storage.
 * Created per-request via createResumeExtractionFSM({ file, userId, profileId }).
 *
 * Flow:
 *  1. IDLE → RECEIVED: file received, processing begins.
 *  2. RECEIVED → PARSE_RESUME: computes SHA-256 hash, validates the PDF
 *     (max 5 pages, not corrupted), and extracts raw text.
 *     - ResumeValidationError → RESUME_VALIDATION_ERROR (terminal)
 *     - ResumeExtractionError → RESUME_EXTRACTION_ERROR (terminal)
 *     - Unexpected error    → ERROR (terminal)
 *  3. RESUME_PARSE_SUCCESS → LLM_EXTRACTION: raw text sent to the LLM.
 *     The LLM response must include { isValid: true } for processing to continue.
 *     - isValid: false → RESUME_PARSE_FAILED (terminal, document is not a resume)
 *  4. UPLOAD_TO_CLOUD → DONE: file uploaded to R2 and a cv_profiles row written
 *     to the DB with structured_data (isValid stripped out) and is_verified: false.
 *  5. DONE: terminal. The user is shown the extracted data for review.
 *     If they edit it, PATCH /profile/resume replaces the structured_data in DB.
 *     If they confirm as-is, no further action is needed.
 */
import crypto from 'node:crypto';
import {
	type ResumeStructuredData,
	resumeStructuredDataSchema,
} from '@uppler/types';

import {
	extractTextFromPDF,
	validatePdf,
} from '../../components/profiles/profiles.service';
import { cvProfileSchema } from '../../schemas/cv_profiles.schema';
import db from '../../utils/db';
import {
	ResumeExtractionError,
	ResumeValidationError,
} from '../../utils/error-utils';
import { llmService } from '../lllm';
import { uploadResumeToBucket } from '../upload-utils';

export const ResumeTransitionState = {
	IDLE: 'idle',
	RECEIVED: 'received',
	PARSE_RESUME: 'parse_resume',
	RESUME_PARSE_SUCCESS: 'resume_parse_success',
	RESUME_VALIDATION_ERROR: 'resume_validation_error',
	RESUME_EXTRACTION_ERROR: 'resume_extraction_error',
	RESUME_PARSE_FAILED: 'resume_parse_failed',
	LLM_EXTRACTION: 'llm_extraction',
	UPLOAD_TO_CLOUD: 'upload_to_cloud',
	DONE: 'done',
	ERROR: 'error',
} as const;

type ResumeState =
	(typeof ResumeTransitionState)[keyof typeof ResumeTransitionState];

type StateTransition = {
	targetState: ResumeState;
	action: () => Promise<void> | void;
	errorTarget?: (error: Error | string) => ResumeState | undefined;
	errorTargetState?: ResumeState;
};

type StateDefinition = {
	transition?: StateTransition;
};

type MachineDefinition = { initialState: ResumeState } & Partial<
	Record<ResumeState, StateDefinition>
>;

type ResumeExtractionContext = {
	buffer: Uint8Array | null;
	hash: string | null;
	rawText: string | null;
	llmResult: Awaited<
		ReturnType<typeof llmService.extractDetailsFromResume>
	> | null;
};

const createMachine = (stateMachineDefinition: MachineDefinition) => {
	const machine = {
		value: stateMachineDefinition.initialState,
		error: null as Error | string | null,
		async run() {
			while (true) {
				const currentStateDefinition = stateMachineDefinition[machine.value];
				const transition = currentStateDefinition?.transition;
				if (!transition?.targetState) break;

				try {
					await transition.action();
					machine.value = transition.targetState;
				} catch (error) {
					const err = error as Error | string;
					machine.error = err;
					const errorState = transition.errorTarget
						? transition.errorTarget(err)
						: transition.errorTargetState;
					if (!errorState) break;
					machine.value = errorState;
					break;
				}
			}
		},
	};
	return machine;
};

export const createResumeExtractionFSM = ({
	file,
	userId,
	profileId,
}: {
	file: File;
	userId: string;
	profileId: string;
}) => {
	const ctx: ResumeExtractionContext = {
		buffer: null,
		hash: null,
		rawText: null,
		llmResult: null,
	};

	const machine = createMachine({
		initialState: ResumeTransitionState.IDLE,
		[ResumeTransitionState.IDLE]: {
			transition: {
				targetState: ResumeTransitionState.RECEIVED,
				action: () => {},
			},
		},
		[ResumeTransitionState.RECEIVED]: {
			transition: {
				targetState: ResumeTransitionState.PARSE_RESUME,
				action: () => {
					console.log(
						'[ResumeExtractionFSM] Received resume, moving to parsing step',
					);
				},
			},
		},
		[ResumeTransitionState.PARSE_RESUME]: {
			transition: {
				targetState: ResumeTransitionState.RESUME_PARSE_SUCCESS,
				errorTarget: (error: Error | string) => {
					if (error instanceof ResumeValidationError)
						return ResumeTransitionState.RESUME_VALIDATION_ERROR;
					if (error instanceof ResumeExtractionError)
						return ResumeTransitionState.RESUME_EXTRACTION_ERROR;
					return ResumeTransitionState.ERROR;
				},
				action: async () => {
					ctx.buffer = new Uint8Array(await file.arrayBuffer());
					ctx.hash = crypto
						.createHash('sha256')
						.update(ctx.buffer)
						.digest('hex');
					await validatePdf(ctx.buffer);
					ctx.rawText = await extractTextFromPDF(file);
				},
			},
		},
		[ResumeTransitionState.RESUME_PARSE_SUCCESS]: {
			transition: {
				targetState: ResumeTransitionState.LLM_EXTRACTION,
				action: () => {
					console.log(
						'[ResumeExtractionFSM] Resume parsed successfully, moving to LLM extraction step',
					);
				},
			},
		},
		[ResumeTransitionState.LLM_EXTRACTION]: {
			transition: {
				targetState: ResumeTransitionState.UPLOAD_TO_CLOUD,
				errorTargetState: ResumeTransitionState.RESUME_PARSE_FAILED,
				action: async () => {
					if (!ctx.rawText)
						throw new Error('rawText is not available for LLM extraction.');
					ctx.llmResult = await llmService.extractDetailsFromResume(
						ctx.rawText,
					);
					if (!ctx.llmResult.isValid) {
						throw new ResumeExtractionError(
							'The uploaded document does not appear to be a valid resume.',
						);
					}
				},
			},
		},
		[ResumeTransitionState.UPLOAD_TO_CLOUD]: {
			transition: {
				targetState: ResumeTransitionState.DONE,
				action: async () => {
					if (!ctx.llmResult)
						throw new Error('llmResult is not available for upload.');
					const resumeKey = await uploadResumeToBucket(file, userId);
					const extractedResumeDetails = resumeStructuredDataSchema.parse(
						ctx.llmResult,
					);
					await db.insert(cvProfileSchema).values({
						profile_id: profileId,
						original_filename: file.name,
						resume_key: resumeKey,
						resume_hash: ctx.hash,
						raw_text: ctx.rawText,
						structured_data: extractedResumeDetails,
						is_verified: false,
						is_active: true,
					});
				},
			},
		},
		[ResumeTransitionState.DONE]: {},
	});

	return {
		run: () => machine.run(),
		get value() {
			return machine.value;
		},
		get error() {
			return machine.error;
		},
		get structuredData(): ResumeStructuredData | null {
			if (!ctx.llmResult) return null;
			return resumeStructuredDataSchema.parse(ctx.llmResult);
		},
	};
};
