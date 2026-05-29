import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
	select: vi.fn(),
	aliasRows: vi.fn(),
	directRows: vi.fn(),
}));

const aliasQueryChain = {
	from: () => aliasQueryChain,
	innerJoin: () => aliasQueryChain,
	where: () => Promise.resolve(dbMocks.aliasRows()),
};

const directQueryChain = {
	from: () => directQueryChain,
	where: () => Promise.resolve(dbMocks.directRows()),
};

vi.mock('../../../utils/db', () => ({
	default: { select: dbMocks.select },
}));

const { normalizeExtractedSkills } =
	await import('../../../components/profiles/profiles.service');

beforeEach(() => {
	vi.clearAllMocks();
	dbMocks.aliasRows.mockReturnValue([]);
	dbMocks.directRows.mockReturnValue([]);
	dbMocks.select
		.mockImplementationOnce(() => aliasQueryChain)
		.mockImplementation(() => directQueryChain);
});

describe('normalizeExtractedSkills — alias match', () => {
	it('resolves a skill via alias to its canonical name and id', async () => {
		dbMocks.aliasRows.mockReturnValue([
			{
				alias: 'nodejs',
				skill_id: 'skill-uuid-1',
				display_name: 'Node.js',
				category: 'Backend',
			},
		]);

		const result = await normalizeExtractedSkills(['nodejs']);

		expect(result).toEqual([
			{
				rawName: 'nodejs',
				canonicalName: 'Node.js',
				canonicalId: 'skill-uuid-1',
				category: 'Backend',
			},
		]);
	});
});

describe('normalizeExtractedSkills — direct match', () => {
	it('resolves a skill matched directly by slug', async () => {
		dbMocks.directRows.mockReturnValue([
			{
				id: 'skill-uuid-2',
				display_name: 'TypeScript',
				category: 'Frontend',
				slug: 'typescript',
			},
		]);

		const result = await normalizeExtractedSkills(['typescript']);

		expect(result).toEqual([
			{
				rawName: 'typescript',
				canonicalName: 'TypeScript',
				canonicalId: 'skill-uuid-2',
				category: 'Frontend',
			},
		]);
	});
});

describe('normalizeExtractedSkills — no match', () => {
	it('returns the raw name with category Other and null canonicalId', async () => {
		const result = await normalizeExtractedSkills(['some-unknown-skill']);

		expect(result).toEqual([
			{
				rawName: 'some-unknown-skill',
				canonicalName: 'some-unknown-skill',
				canonicalId: null,
				category: 'Other',
			},
		]);
	});

	it('returns an empty array when given no skills', async () => {
		const result = await normalizeExtractedSkills([]);
		expect(result).toEqual([]);
	});
});
