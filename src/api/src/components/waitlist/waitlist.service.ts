import { eq } from 'drizzle-orm';

import { waitlistSchema } from '../../schemas/waitlist.schema';
import db from '../../utils/db';
import { emailSender } from '../../utils/email_utils';

export async function joinWaitlist(
	email: string,
): Promise<{ alreadyExists: boolean }> {
	const existing = await db
		.select({ id: waitlistSchema.id })
		.from(waitlistSchema)
		.where(eq(waitlistSchema.email, email))
		.limit(1);

	if (existing.length > 0) return { alreadyExists: true };

	await db.insert(waitlistSchema).values({ email });

	emailSender.sendWaitlistConfirmationEmail(email).catch(() => {
		// Non-fatal — don't block the response if email fails
	});

	return { alreadyExists: false };
}
