import { beforeEach, describe, expect, it, vi } from 'vitest';

const langfuseMocks = vi.hoisted(() => ({
	get: vi.fn(),
	compile: vi.fn(),
}));

vi.mock('@langfuse/client', () => ({
	LangfuseClient: class {
		prompt = { get: langfuseMocks.get };
	},
}));

const { default: Langfuse } = await import('../../../lib/lllm/langfuse');

const langfuse = new Langfuse();

const compiledMessages = [
	{ role: 'system', content: 'Extract the resume.' },
	{ role: 'user', content: 'Resume: ...' },
];

beforeEach(() => {
	vi.clearAllMocks();
	langfuseMocks.compile.mockReturnValue(compiledMessages);
	langfuseMocks.get.mockResolvedValue({ compile: langfuseMocks.compile });
});

describe('Langfuse.compileExtractResumePrompt', () => {
	it('fetches the correct prompt from Langfuse', async () => {
		await langfuse.compileExtractResumePrompt('My resume text');
		expect(langfuseMocks.get).toHaveBeenCalledWith(
			'uplerr-resume-extraction',
			undefined,
		);
	});

	it('compiles the prompt with RESUME_TEXT substituted', async () => {
		await langfuse.compileExtractResumePrompt('My resume text');
		expect(langfuseMocks.compile).toHaveBeenCalledWith({
			RESUME_TEXT: 'My resume text',
		});
	});

	it('returns the compiled messages', async () => {
		const result = await langfuse.compileExtractResumePrompt('My resume text');
		expect(result).toEqual(compiledMessages);
	});

	it('propagates errors from the Langfuse client', async () => {
		langfuseMocks.get.mockRejectedValue(new Error('Langfuse unavailable'));
		await expect(langfuse.compileExtractResumePrompt('text')).rejects.toThrow(
			'Langfuse unavailable',
		);
	});
});

describe('Langfuse.getPrompt (private)', () => {
	it('passes { type: "text" } when isTextPrompt is true', async () => {
		await (
			langfuse as unknown as {
				getPrompt: (n: string, t: boolean) => Promise<unknown>;
			}
		).getPrompt('some-prompt', true);
		expect(langfuseMocks.get).toHaveBeenCalledWith('some-prompt', {
			type: 'text',
		});
	});
});
