import { z, ZodType } from 'zod';
import { Anthropic } from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { resumeStructuredDataSchema } from '@uppler/types';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

const ResumeExtractionSchema = resumeStructuredDataSchema.extend({
	isValid: z.boolean(),
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
