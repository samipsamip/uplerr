import { LangfuseClient } from '@langfuse/client';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export default class Langfuse {
	private static readonly PROMPTS = {
		RESUME_EXTRACTION: 'uplerr-resume-extraction',
	} as const;

	constructor(private readonly client = new LangfuseClient()) {}

	private async getPrompt(promptName: string, isTextPrompt: boolean = false) {
		return this.client.prompt.get(
			promptName,
			isTextPrompt ? { type: 'text' } : undefined,
		);
	}
	private async compilePrompt(
		promptName: string,
		variables?: Record<string, string>,
	) {
		const prompt = await this.getPrompt(promptName);
		return prompt.compile(variables);
	}
	async compileExtractResumePrompt(prompt: string): Promise<ChatMessage[]> {
		return this.compilePrompt(Langfuse.PROMPTS.RESUME_EXTRACTION, {
			RESUME_TEXT: prompt,
		}) as unknown as Promise<ChatMessage[]>;
	}
}
