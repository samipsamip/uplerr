import { beforeEach, describe, expect, it, vi } from 'vitest';

const anthropicMocks = vi.hoisted(() => ({
	create: vi.fn(),
	parse: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => ({
	Anthropic: class {
		messages = { create: anthropicMocks.create, parse: anthropicMocks.parse };
	},
}));

vi.mock('@anthropic-ai/sdk/helpers/zod', () => ({
	zodOutputFormat: vi.fn().mockReturnValue({ type: 'json_schema', schema: {} }),
}));

const { default: Claude } = await import('../../../lib/lllm/claude');

const claude = new Claude();

const chatResponse = { content: [{ type: 'text', text: 'hello' }] };

const resumeOutput = {
	parsed_output: {
		isValid: true,
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		skills: ['TypeScript'],
		experience: [],
		education: [],
	},
};

const skillInferenceOutput = {
	parsed_output: {
		inferences: [
			{ name: 'TypeScript', level: 'advanced' },
			{ name: 'React', level: 'intermediate' },
		],
	},
};

beforeEach(() => {
	vi.clearAllMocks();
	anthropicMocks.create.mockResolvedValue(chatResponse);
	anthropicMocks.parse.mockResolvedValue(resumeOutput);
});

describe('Claude.chat', () => {
	it('calls messages.create with the user prompt and model', async () => {
		await claude.chat('Hello?', 'You are helpful.');
		expect(anthropicMocks.create).toHaveBeenCalledWith(
			expect.objectContaining({
				messages: [{ role: 'user', content: 'Hello?' }],
				system: 'You are helpful.',
			}),
		);
	});

	it('works without a system prompt', async () => {
		await claude.chat('Hello?');
		expect(anthropicMocks.create).toHaveBeenCalledWith(
			expect.objectContaining({ system: undefined }),
		);
	});

	it('returns the raw API response', async () => {
		const result = await claude.chat('Hello?');
		expect(result).toBe(chatResponse);
	});
});

describe('Claude.extractResume', () => {
	it('calls messages.parse and returns parsed_output', async () => {
		const messages = [
			{ role: 'system' as const, content: 'Extract this resume.' },
			{ role: 'user' as const, content: 'Resume text here.' },
		];

		const result = await claude.extractResume(messages);

		expect(anthropicMocks.parse).toHaveBeenCalledOnce();
		expect(result).toMatchObject({ isValid: true, name: 'Ada Lovelace' });
	});

	it('uses the Sonnet model', async () => {
		await claude.extractResume([{ role: 'user', content: 'resume' }]);
		expect(anthropicMocks.parse).toHaveBeenCalledWith(
			expect.objectContaining({ model: 'claude-sonnet-4-6' }),
		);
	});

	it('filters the system message out of the messages array', async () => {
		await claude.extractResume([
			{ role: 'system', content: 'system prompt' },
			{ role: 'user', content: 'user message' },
		]);

		const call = anthropicMocks.parse.mock.calls[0][0];
		expect(call.system).toBe('system prompt');
		expect(call.messages).not.toContainEqual(
			expect.objectContaining({ role: 'system' }),
		);
	});
});

describe('Claude.inferSkillLevels', () => {
	beforeEach(() => {
		anthropicMocks.parse.mockResolvedValue(skillInferenceOutput);
	});

	it('returns a Map with lowercase skill names as keys', async () => {
		const result = await claude.inferSkillLevels(
			['TypeScript', 'React'],
			'3 years at Acme Corp.',
		);

		expect(result).toBeInstanceOf(Map);
		expect(result.get('typescript')).toBe('advanced');
		expect(result.get('react')).toBe('intermediate');
	});

	it('uses the Haiku model', async () => {
		await claude.inferSkillLevels(['TypeScript'], 'work history');
		expect(anthropicMocks.parse).toHaveBeenCalledWith(
			expect.objectContaining({ model: 'claude-haiku-4-5-20251001' }),
		);
	});

	it('includes skills and work history in the user message', async () => {
		await claude.inferSkillLevels(
			['Go', 'Postgres'],
			'Senior engineer at Stripe',
		);
		const messages = anthropicMocks.parse.mock.calls[0][0].messages;
		const userMsg = messages.find(
			(m: { role: string }) => m.role === 'user',
		).content;
		expect(userMsg).toContain('Go, Postgres');
		expect(userMsg).toContain('Senior engineer at Stripe');
	});
});
