import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
	? new Resend(process.env.RESEND_API_KEY)
	: null;

const FROM = process.env.EMAIL_FROM ?? 'Uppler <noreply@example.com>';

async function send(
	to: string,
	subject: string,
	html: string,
	logUrl?: string,
) {
	if (resend) {
		const { error } = await resend.emails.send({
			from: FROM,
			to,
			subject,
			html,
		});
		if (error) throw new Error(`Failed to send email: ${error.message}`);
	} else {
		console.log(
			`[email] to=${to} subject="${subject}"${logUrl ? ` url=${logUrl}` : ''}`,
		);
	}
}

export const emailSender = {
	async sendVerificationEmail(name: string, email: string, url: string) {
		await send(
			email,
			'Verify your Uppler email',
			`<p>Hi ${name},</p><p>Click the link below to verify your email address:</p><p><a href="${url}">${url}</a></p><p>— Uppler</p>`,
			url,
		);
	},

	async sendResetPasswordEmail(name: string, email: string, url: string) {
		await send(
			email,
			'Reset your Uppler password',
			`<p>Hi ${name},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can safely ignore this email.</p><p>— Uppler</p>`,
			url,
		);
	},
};
