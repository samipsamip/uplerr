import { z, ZodType } from 'zod';
import { Anthropic } from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const ResumeExtractionSchema = z.object({
	name: z.string(),
	email: z.string().optional(),
	phone: z.string().optional(),
	location: z.string().optional(),
	links: z
		.object({
			linkedin: z.string().optional(),
			github: z.string().optional(),
			portfolio: z.string().optional(),
		})
		.optional(),
	skills: z.array(z.string()),
	experience: z.array(
		z.object({
			company: z.string(),
			role: z.string(),
			duration: z.string().optional(),
			description: z.string().optional(),
		}),
	),
	education: z.array(
		z.object({
			institution: z.string(),
			degree: z.string(),
			year: z.string().optional(),
		}),
	),
});

export type ResumeData = z.infer<typeof ResumeExtractionSchema>;

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
	): Promise<T> {
		const system = compiledMessages.find((m) => m.role === 'system')?.content;
		const messages = compiledMessages
			.filter((m) => m.role !== 'system')
			.map((m) => ({
				role: m.role as 'user' | 'assistant',
				content: m.content,
			}));

		const response = await this.client.messages.parse({
			model: ANTHROPIC_MODEL,
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
}
