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
