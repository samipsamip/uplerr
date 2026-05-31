import { and, count, eq, inArray, or, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import type {
	CvStructuredData,
	ProjectExtractionType,
	ResumeExtractionType,
	SkillExtractionType,
} from '@uppler/types';

import { cvProfileSchema } from '../../schemas/cv_profiles.schema';
import { profileSchema } from '../../schemas/profiles.schema';
import { resumeModerationSchema } from '../../schemas/resume_moderations.schema';
import { skillAliasSchema } from '../../schemas/skill_aliases.schema';
import { skillsSchema } from '../../schemas/skills.schema';
import db from '../../utils/db';
import {
	ResumeDuplicateError,
	ResumeExtractionError,
	ResumeModerationError,
	ResumeValidationError,
} from '../../utils/error-utils';
import { notDeleted } from '../../utils/helpers';
import { braintrust } from '../lllm/braintrust';
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
	MODERATION_CHECK: 'moderation_check',
	MALICIOUS_CONTENT_DETECTED: 'malicious_content_detected',
	VALIDATION_CHECK: 'validation_check',
	RESUME_PARSE_FAILED: 'resume_parse_failed',
	RESUME_EXTRACTION: 'resume_extraction',
	SKILLS_EXTRACTION: 'skills_extraction',
	PROJECTS_EXTRACTION: 'projects_extraction',
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

const MALICIOUS_UPLOAD_BAN_THRESHOLD = 3;

type ResumeExtractionContext = {
	buffer: Uint8Array | null;
	hash: string | null;
	rawText: string | null;
	pdfLinks: string[];
	extractionResult: ResumeExtractionType | null;
	skillsResult: SkillExtractionType | null;
	projectsResult: ProjectExtractionType | null;
	existingCv: { id: string; resume_key: string | null } | null;
	skillMatchMeta: SkillMatchMeta;
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
		pdfLinks: [],
		extractionResult: null,
		skillsResult: null,
		projectsResult: null,
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
				action: () => {},
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
				action: () => {},
			},
		},
		[ResumeTransitionState.DUPLICATE_CHECK]: {
			transition: {
				targetState: ResumeTransitionState.MODERATION_CHECK,
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
		[ResumeTransitionState.MODERATION_CHECK]: {
			transition: {
				targetState: ResumeTransitionState.VALIDATION_CHECK,
				errorTargetState: ResumeTransitionState.MALICIOUS_CONTENT_DETECTED,
				action: async () => {
					if (!ctx.rawText) throw new Error('rawText unavailable.');

					const result = await braintrust.checkForModeration(
						ctx.rawText,
						profileId,
					);

					if (result.is_malicious) {
						await db.insert(resumeModerationSchema).values({
							profile_id: profileId,
							raw_text: ctx.rawText,
							reason: result.reason,
						});

						const [{ value: moderationCount }] = await db
							.select({ value: count() })
							.from(resumeModerationSchema)
							.where(eq(resumeModerationSchema.profile_id, profileId));

						if (moderationCount >= MALICIOUS_UPLOAD_BAN_THRESHOLD) {
							await db
								.update(profileSchema)
								.set({
									is_banned: true,
									ban_reason:
										'Your account has been suspended due to repeated upload of malicious content.',
									updated_at: new Date(),
								})
								.where(eq(profileSchema.id, profileId));
						}

						throw new ResumeModerationError(result.reason);
					}
				},
			},
		},
		[ResumeTransitionState.VALIDATION_CHECK]: {
			transition: {
				targetState: ResumeTransitionState.RESUME_EXTRACTION,
				errorTargetState: ResumeTransitionState.RESUME_PARSE_FAILED,
				action: async () => {
					if (!ctx.rawText) throw new Error('rawText unavailable.');

					const result = await braintrust.performValidationCheckOnResume(
						ctx.rawText,
						profileId,
					);

					if (!result.isValid) {
						throw new ResumeExtractionError(
							'The uploaded document does not appear to be a valid resume.',
						);
					}
				},
			},
		},
		[ResumeTransitionState.RESUME_EXTRACTION]: {
			transition: {
				targetState: ResumeTransitionState.SKILLS_EXTRACTION,
				errorTargetState: ResumeTransitionState.RESUME_PARSE_FAILED,
				action: async () => {
					if (!ctx.rawText) throw new Error('rawText unavailable.');
					ctx.extractionResult = await braintrust.performResumeExtraction(
						ctx.rawText,
						ctx.pdfLinks,
						profileId,
					);
				},
			},
		},
		[ResumeTransitionState.SKILLS_EXTRACTION]: {
			transition: {
				targetState: ResumeTransitionState.PROJECTS_EXTRACTION,
				errorTargetState: ResumeTransitionState.RESUME_PARSE_FAILED,
				action: async () => {
					if (!ctx.rawText) throw new Error('rawText unavailable.');
					ctx.skillsResult = await braintrust.performSkillsExtraction(
						ctx.rawText,
						profileId,
					);
				},
			},
		},
		[ResumeTransitionState.PROJECTS_EXTRACTION]: {
			transition: {
				targetState: ResumeTransitionState.UPLOAD_TO_CLOUD,
				errorTargetState: ResumeTransitionState.RESUME_PARSE_FAILED,
				action: async () => {
					if (!ctx.rawText) throw new Error('rawText unavailable.');
					ctx.projectsResult = await braintrust.performProjectsExtraction(
						ctx.rawText,
						ctx.pdfLinks,
						profileId,
					);
				},
			},
		},
		[ResumeTransitionState.UPLOAD_TO_CLOUD]: {
			transition: {
				targetState: ResumeTransitionState.SKILL_PREMATCH,
				action: async () => {
					if (!ctx.extractionResult || !ctx.skillsResult || !ctx.projectsResult)
						throw new Error('Extraction results unavailable for upload.');

					const resumeKey = await uploadResumeToBucket(file, userId);
					const structuredData: CvStructuredData = {
						extraction: ctx.extractionResult,
						skills: ctx.skillsResult,
						projects: ctx.projectsResult,
					};

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
							structured_data: structuredData,
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
					const skills = [
						...(ctx.skillsResult?.technical_skills ?? []),
						...(ctx.skillsResult?.tools_platforms ?? []),
					];
					if (skills.length === 0) return;

					try {
						const lowerNames = skills.map((s) => s.name.toLowerCase().trim());

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
		get structuredData(): CvStructuredData | null {
			if (!ctx.extractionResult || !ctx.skillsResult || !ctx.projectsResult)
				return null;
			return {
				extraction: ctx.extractionResult,
				skills: ctx.skillsResult,
				projects: ctx.projectsResult,
			};
		},
		get skillMatchMeta(): SkillMatchMeta {
			return ctx.skillMatchMeta;
		},
	};
};
