import { beforeEach, describe, expect, it, vi } from 'vitest';

const langfuseMocks = vi.hoisted(() => ({
	compileExtractResumePrompt: vi.fn(),
}));
const claudeMocks = vi.hoisted(() => ({ extractResume: vi.fn() }));

vi.mock('../../../lib/lllm/langfuse', () => ({
	default: class {
		compileExtractResumePrompt = langfuseMocks.compileExtractResumePrompt;
	},
}));

vi.mock('../../../lib/lllm/claude', () => ({
	default: class {
		extractResume = claudeMocks.extractResume;
	},
}));

const { llmService } = await import('../../../lib/lllm');

const compiledMessages = [
	{ role: 'system' as const, content: 'Extract.' },
	{ role: 'user' as const, content: 'Resume text.' },
];

const extractedResume = {
	isValid: true,
	name: 'Ada Lovelace',
	skills: ['TypeScript'],
	experience: [],
	education: [],
};

beforeEach(() => {
	vi.clearAllMocks();
	langfuseMocks.compileExtractResumePrompt.mockResolvedValue(compiledMessages);
	claudeMocks.extractResume.mockResolvedValue(extractedResume);
});

describe('LLMService.extractDetailsFromResume', () => {
	it('compiles the prompt with the provided resume text', async () => {
		await llmService.extractDetailsFromResume('raw resume text');
		expect(langfuseMocks.compileExtractResumePrompt).toHaveBeenCalledWith(
			'raw resume text',
		);
	});

	it('passes compiled messages to Claude extractResume', async () => {
		await llmService.extractDetailsFromResume('raw resume text');
		expect(claudeMocks.extractResume).toHaveBeenCalledWith(compiledMessages);
	});

	it('returns the result from Claude', async () => {
		const result = await llmService.extractDetailsFromResume('raw resume text');
		expect(result).toEqual(extractedResume);
	});

	it('propagates errors from Langfuse', async () => {
		langfuseMocks.compileExtractResumePrompt.mockRejectedValue(
			new Error('Langfuse unavailable'),
		);
		await expect(llmService.extractDetailsFromResume('text')).rejects.toThrow(
			'Langfuse unavailable',
		);
	});

	it('propagates errors from Claude', async () => {
		claudeMocks.extractResume.mockRejectedValue(new Error('API timeout'));
		await expect(llmService.extractDetailsFromResume('text')).rejects.toThrow(
			'API timeout',
		);
	});
});
