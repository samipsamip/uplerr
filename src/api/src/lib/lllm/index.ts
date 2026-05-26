import Claude from './claude';
import Langfuse from './langfuse';

const langfuse = new Langfuse();
const claude = new Claude();

class LLMService {
	constructor(
		private readonly langfuse: Langfuse,
		private readonly claude: Claude,
	) {}

	async extractDetailsFromResume(prompt: string) {
		const compiledMessages =
			await this.langfuse.compileExtractResumePrompt(prompt);
		return this.claude.extractResume(compiledMessages);
	}
}

export const llmService = new LLMService(langfuse, claude);
