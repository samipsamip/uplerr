import { z, ZodType } from 'zod';
import { Anthropic } from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { resumeStructuredDataSchema } from '@uppler/types';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

const ResumeExtractionSchema = resumeStructuredDataSchema.extend({
	isValid: z.boolean(),
});

const SkillInferenceSchema = z.object({
	inferences: z.array(
		z.object({
			name: z.string(),
			level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
		}),
	),
});

export type ResumeData = z.infer<typeof ResumeExtractionSchema>;
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export default class Claude {
	constructor(
		private readonly client = new Anthropic({
			apiKey: process.env.ANTHROPIC_API_KEY || '',
		}),
	) {}

	async chat(userPrompt: string, systemPrompt?: string) {
		return this.client.messages.create({
			system: systemPrompt,
			messages: [{ role: 'user', content: userPrompt }],
			max_tokens: 4000,
			model: ANTHROPIC_MODEL,
		});
	}

	private async parseWithSchema<T>(
		compiledMessages: ChatMessage[],
		schema: ZodType<T>,
		model: string = ANTHROPIC_MODEL,
	): Promise<T> {
		const system = compiledMessages.find((m) => m.role === 'system')?.content;
		const messages = compiledMessages
			.filter((m) => m.role !== 'system')
			.map((m) => ({
				role: m.role as 'user' | 'assistant',
				content: m.content,
			}));

		const response = await this.client.messages.parse({
			model,
			max_tokens: 4000,
			system,
			messages,
			output_config: {
				format: zodOutputFormat(schema),
			},
		});

		return response.parsed_output!;
	}

	async extractResume(compiledMessages: ChatMessage[]): Promise<ResumeData> {
		return this.parseWithSchema(compiledMessages, ResumeExtractionSchema);
	}

	async inferSkillLevels(
		skills: string[],
		workHistoryText: string,
	): Promise<Map<string, SkillLevel>> {
		const messages: ChatMessage[] = [
			{
				role: 'system',
				content:
					"You are an expert technical recruiter. Given a list of skills and a candidate's work history, infer the proficiency level for each skill. Use: beginner (< 1 year or brief mention), intermediate (1-3 years or real project use), advanced (3-5 years or senior/lead capacity), expert (5+ years or deep specialization). Return every skill from the input list.",
			},
			{
				role: 'user',
				content: `Skills to assess: ${skills.join(', ')}\n\nWork history:\n${workHistoryText}`,
			},
		];

		const result = await this.parseWithSchema(
			messages,
			SkillInferenceSchema,
			HAIKU_MODEL,
		);
		return new Map(
			result.inferences.map((i) => [i.name.toLowerCase(), i.level]),
		);
	}
}
