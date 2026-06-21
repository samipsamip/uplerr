import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('resend', () => ({
	Resend: class {
		emails = { send: vi.fn().mockResolvedValue({ error: null }) };
	},
}));

// RESEND_API_KEY is not set in the test environment, so all calls fall through
// to the console.log path. We just verify they don't throw and log the URL.
const { emailSender } = await import('../../utils/email_utils');

describe('emailSender — LOG_ONLY mode (no RESEND_API_KEY)', () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it('sendVerificationEmail logs the url', async () => {
		await emailSender.sendVerificationEmail(
			'Alice',
			'alice@example.com',
			'http://verify.example.com',
		);
		expect(consoleSpy).toHaveBeenCalledOnce();
		expect(consoleSpy.mock.calls[0][0]).toContain('http://verify.example.com');
	});

	it('sendResetPasswordEmail logs the url', async () => {
		await emailSender.sendResetPasswordEmail(
			'Bob',
			'bob@example.com',
			'http://reset.example.com',
		);
		expect(consoleSpy).toHaveBeenCalledOnce();
		expect(consoleSpy.mock.calls[0][0]).toContain('http://reset.example.com');
	});
});
