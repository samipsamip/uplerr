/**
 * Resume Extraction FSM
 *
 * Processes uploaded resumes through validation, duplicate detection,
 * LLM-based parsing, cloud upload, and CV persistence. PDFs are validated,
 * hashed, and parsed before checking for existing active CVs with the same hash.
 *
 * Valid resumes are enriched with extracted links, uploaded to R2, and stored
 * as structured cv_profiles data while replacing any previously active CV.
 * The FSM also performs lightweight skill prematching and exposes match metadata
 * in the final API response. Validation, extraction, duplicate, and non-resume
 * failures terminate in dedicated error states.
 */
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import {
	type ResumeStructuredData,
	resumeStructuredDataSchema,
} from '@uppler/types';

import { cvProfileSchema } from '../../schemas/cv_profiles.schema';
import { skillAliasSchema } from '../../schemas/skill_aliases.schema';
import { skillsSchema } from '../../schemas/skills.schema';
import db from '../../utils/db';
import {
	ResumeDuplicateError,
	ResumeExtractionError,
	ResumeValidationError,
} from '../../utils/error-utils';
import { notDeleted } from '../../utils/helpers';
import { llmService } from '../lllm';
import pdfParser from '../pdf-parser';
import { deleteResumeFromBucket, uploadResumeToBucket } from '../upload-utils';

export const ResumeTransitionState = {
	IDLE: 'idle',
	RECEIVED: 'received',
	PARSE_RESUME: 'parse_resume',
	RESUME_PARSE_SUCCESS: 'resume_parse_success',
	DUPLICATE_CHECK: 'duplicate_check',
	RESUME_DUPLICATE: 'resume_duplicate',
	RESUME_VALIDATION_ERROR: 'resume_validation_error',
	RESUME_EXTRACTION_ERROR: 'resume_extraction_error',
	RESUME_PARSE_FAILED: 'resume_parse_failed',
	LLM_EXTRACTION: 'llm_extraction',
	UPLOAD_TO_CLOUD: 'upload_to_cloud',
	SKILL_PREMATCH: 'skill_prematch',
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

export type SkillMatchMeta = { matched: number; total: number };

type ResumeExtractionContext = {
	buffer: Uint8Array | null;
	hash: string | null;
	rawText: string | null;
	pdfLinks: string[];
	llmResult: Awaited<
		ReturnType<typeof llmService.extractDetailsFromResume>
	> | null;
	existingCv: { id: string; resume_key: string | null } | null;
	skillMatchMeta: SkillMatchMeta;
};

function mergePdfLinks(
	llmLinks: ResumeStructuredData['links'],
	pdfLinks: string[],
): ResumeStructuredData['links'] {
	const merged: ResumeStructuredData['links'] = { ...llmLinks };
	for (const link of pdfLinks) {
		if (!merged?.github && /github\.com\//i.test(link)) {
			merged!.github = link;
		} else if (!merged?.linkedin && /linkedin\.com\//i.test(link)) {
			merged!.linkedin = link;
		} else if (
			!merged?.portfolio &&
			/^https?:\/\//i.test(link) &&
			!/github\.com|linkedin\.com/i.test(link)
		) {
			merged!.portfolio = link;
		}
	}
	return merged;
}

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
		pdfLinks: [],
		llmResult: null,
		existingCv: null,
		skillMatchMeta: { matched: 0, total: 0 },
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
					const { text, links } = await pdfParser.parse(ctx.buffer);
					ctx.rawText = text;
					ctx.pdfLinks = links;
				},
			},
		},
		[ResumeTransitionState.RESUME_PARSE_SUCCESS]: {
			transition: {
				targetState: ResumeTransitionState.DUPLICATE_CHECK,
				action: () => {
					console.log(
						'[ResumeExtractionFSM] Resume parsed successfully, checking for duplicates',
					);
				},
			},
		},
		[ResumeTransitionState.DUPLICATE_CHECK]: {
			transition: {
				targetState: ResumeTransitionState.LLM_EXTRACTION,
				errorTarget: (error: Error | string) => {
					if (error instanceof ResumeDuplicateError)
						return ResumeTransitionState.RESUME_DUPLICATE;
					return ResumeTransitionState.ERROR;
				},
				action: async () => {
					const [existing] = await db
						.select({
							id: cvProfileSchema.id,
							resume_key: cvProfileSchema.resume_key,
							resume_hash: cvProfileSchema.resume_hash,
						})
						.from(cvProfileSchema)
						.where(
							and(
								eq(cvProfileSchema.profile_id, profileId),
								eq(cvProfileSchema.is_active, true),
								notDeleted(cvProfileSchema),
							),
						)
						.limit(1);

					if (existing?.resume_hash === ctx.hash) {
						throw new ResumeDuplicateError();
					}

					ctx.existingCv = existing
						? { id: existing.id, resume_key: existing.resume_key }
						: null;
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
				targetState: ResumeTransitionState.SKILL_PREMATCH,
				action: async () => {
					if (!ctx.llmResult)
						throw new Error('llmResult is not available for upload.');
					const resumeKey = await uploadResumeToBucket(file, userId);

					const mergedLinks = mergePdfLinks(ctx.llmResult.links, ctx.pdfLinks);
					const extractedResumeDetails = resumeStructuredDataSchema.parse({
						...ctx.llmResult,
						links: mergedLinks,
					});

					await db.transaction(async (tx) => {
						if (ctx.existingCv) {
							await tx
								.update(cvProfileSchema)
								.set({ is_active: false, updated_at: new Date() })
								.where(eq(cvProfileSchema.id, ctx.existingCv.id));
						}
						await tx.insert(cvProfileSchema).values({
							profile_id: profileId,
							original_filename: file.name,
							resume_key: resumeKey,
							resume_hash: ctx.hash,
							raw_text: ctx.rawText,
							structured_data: extractedResumeDetails,
							is_verified: false,
							is_active: true,
						});
					});

					if (ctx.existingCv?.resume_key) {
						await deleteResumeFromBucket(ctx.existingCv.resume_key);
					}
				},
			},
		},
		[ResumeTransitionState.SKILL_PREMATCH]: {
			transition: {
				targetState: ResumeTransitionState.DONE,
				action: async () => {
					const skills = ctx.llmResult?.skills ?? [];
					if (skills.length === 0) return;

					try {
						const lowerNames = skills.map((s) => s.toLowerCase().trim());

						const [aliasMatches, directMatches] = await Promise.all([
							db
								.selectDistinct({ skill_id: skillAliasSchema.skill_id })
								.from(skillAliasSchema)
								.where(
									inArray(sql`lower(${skillAliasSchema.alias})`, lowerNames),
								),
							db
								.selectDistinct({ id: skillsSchema.id })
								.from(skillsSchema)
								.where(
									and(
										notDeleted(skillsSchema),
										or(
											inArray(sql`lower(${skillsSchema.slug})`, lowerNames),
											inArray(
												sql`lower(${skillsSchema.display_name})`,
												lowerNames,
											),
										),
									),
								),
						]);

						const matchedIds = new Set([
							...aliasMatches.map((r) => r.skill_id),
							...directMatches.map((r) => r.id),
						]);

						ctx.skillMatchMeta = {
							matched: matchedIds.size,
							total: skills.length,
						};
					} catch {
						ctx.skillMatchMeta = { matched: 0, total: skills.length };
					}
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
			return resumeStructuredDataSchema.parse({
				...ctx.llmResult,
				links: mergePdfLinks(ctx.llmResult.links, ctx.pdfLinks),
			});
		},
		get skillMatchMeta(): SkillMatchMeta {
			return ctx.skillMatchMeta;
		},
	};
};
