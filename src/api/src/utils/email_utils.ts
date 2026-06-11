import { Resend } from 'resend';

import { EMAIL_TEMPLATE_ID } from './constants';

export default class ProductEmail {
	constructor(private emailClient: Resend) {}
	async sendVerificationEmail(
		fullName: string,
		email: string,
		url: string,
	): Promise<void> {
		const { error } = await this.emailClient.emails.send({
			to: email,
			template: {
				id: EMAIL_TEMPLATE_ID.welcomeEmail,
				variables: {
					fullName: fullName,
					verificationURL: url,
				},
			},
		});
		if (error)
			throw new Error(`Failed to send verification email: ${error.message}`);
	}

	async sendApprovalEmail(name: string, email: string): Promise<void> {
		const appUrl = process.env.APP_URL ?? 'https://app.uplerr.com';
		const { error } = await this.emailClient.emails.send({
			from: 'Uppler <noreply@uplerr.com>',
			to: email,
			subject: "You're in — welcome to Uppler",
			html: `
				<p>Hi ${name},</p>
				<p>Great news — your Uppler account has been approved. You can now log in and start building your career roadmap.</p>
				<p><a href="${appUrl}">Log in to Uppler →</a></p>
				<p>— The Uppler Team</p>
			`,
		});
		if (error)
			throw new Error(`Failed to send approval email: ${error.message}`);
	}

	async sendWaitlistConfirmationEmail(email: string): Promise<void> {
		const { error } = await this.emailClient.emails.send({
			from: 'Uppler <noreply@uplerr.com>',
			to: email,
			subject: "You're on the Uppler waitlist",
			html: `
				<p>Hi,</p>
				<p>You're on the list. We're admitting users gradually and will send your invite as soon as your spot opens up.</p>
				<p>In the meantime, feel free to reply to this email with any questions.</p>
				<p>— The Uppler Team</p>
			`,
		});
		if (error)
			throw new Error(`Failed to send waitlist email: ${error.message}`);
	}

	async sendResetPasswordEmail(
		fullName: string,
		email: string,
		url: string,
	): Promise<void> {
		const { error } = await this.emailClient.emails.send({
			to: email,
			template: {
				id: EMAIL_TEMPLATE_ID.resetPassword,
				variables: {
					resetPasswordURL: url,
					fullName: fullName,
				},
			},
		});
		if (error)
			throw new Error(`Failed to send password reset email: ${error.message}`);
	}
}

export const emailSender = new ProductEmail(
	new Resend(process.env.RESEND_API_KEY ?? ''),
);
