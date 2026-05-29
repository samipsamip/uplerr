import { beforeEach, describe, expect, it, vi } from 'vitest';

const resendMocks = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('resend', () => ({
	Resend: class {
		emails = { send: resendMocks.send };
	},
}));

const { default: ProductEmail } = await import('../../utils/email_utils');

const mockClient = { emails: { send: resendMocks.send } } as never;
const emailService = new ProductEmail(mockClient);

beforeEach(() => {
	vi.clearAllMocks();
	resendMocks.send.mockResolvedValue({ error: null });
});

describe('ProductEmail.sendVerificationEmail', () => {
	it('calls send with the correct recipient and template variables', async () => {
		await emailService.sendVerificationEmail(
			'John Doe',
			'john@example.com',
			'https://verify.example.com',
		);

		expect(resendMocks.send).toHaveBeenCalledOnce();
		expect(resendMocks.send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'john@example.com',
				template: expect.objectContaining({
					variables: expect.objectContaining({
						fullName: 'John Doe',
						verificationURL: 'https://verify.example.com',
					}),
				}),
			}),
		);
	});

	it('does not throw when send returns an error', async () => {
		resendMocks.send.mockResolvedValue({
			error: { message: 'Delivery failed' },
		});
		await expect(
			emailService.sendVerificationEmail(
				'John',
				'john@example.com',
				'https://url',
			),
		).resolves.toBeUndefined();
	});

	it('does not throw when send rejects', async () => {
		resendMocks.send.mockRejectedValue(new Error('Network error'));
		await expect(
			emailService.sendVerificationEmail(
				'John',
				'john@example.com',
				'https://url',
			),
		).rejects.toThrow('Network error');
	});
});

describe('ProductEmail.sendResetPasswordEmail', () => {
	it('calls send with the correct recipient and template variables', async () => {
		await emailService.sendResetPasswordEmail(
			'Jane Doe',
			'jane@example.com',
			'https://reset.example.com',
		);

		expect(resendMocks.send).toHaveBeenCalledOnce();
		expect(resendMocks.send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'jane@example.com',
				template: expect.objectContaining({
					variables: expect.objectContaining({
						fullName: 'Jane Doe',
						resetPasswordURL: 'https://reset.example.com',
					}),
				}),
			}),
		);
	});

	it('does not throw when send returns an error', async () => {
		resendMocks.send.mockResolvedValue({
			error: { message: 'Delivery failed' },
		});
		await expect(
			emailService.sendResetPasswordEmail(
				'Jane',
				'jane@example.com',
				'https://url',
			),
		).resolves.toBeUndefined();
	});
});
