/**
 * Usage: pnpm approve <email>
 *
 * Run this after manually setting is_approved = true in the DB.
 * Sends the "you're in" email to the user.
 */

import { eq } from 'drizzle-orm';

import { user } from '../schemas/auth-schema';
import db from '../utils/db';
import { emailSender } from '../utils/email_utils';

const email = process.argv[2];

if (!email) {
	console.error('Usage: pnpm approve <email>');
	process.exit(1);
}

const [found] = await db
	.select({ name: user.name, email: user.email })
	.from(user)
	.where(eq(user.email, email))
	.limit(1);

if (!found) {
	console.error(`No user found with email: ${email}`);
	process.exit(1);
}

await emailSender.sendApprovalEmail(found.name, found.email);
console.log(`Approval email sent to ${found.email}`);
process.exit(0);
