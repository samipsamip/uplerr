import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';

const S3 = new S3Client({
	region: 'auto',
	endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID || ''}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '',
	},
});

export const uploadResumeToBucket = async (
	file: Blob,
	uniqueIdentifier: string,
): Promise<string> => {
	const key = `${uniqueIdentifier}-resume-${Date.now()}.pdf`;
	await S3.send(
		new PutObjectCommand({
			Bucket: process.env.CLOUDFLARE_STORAGE_BUCKET,
			Key: key,
			Body: Buffer.from(await file.arrayBuffer()),
			ContentType: 'application/pdf',
		}),
	);
	return key;
};

export const deleteResumeFromBucket = async (uniqueIdentifier: string) => {
	await S3.send(
		new DeleteObjectCommand({
			Bucket: process.env.CLOUDFLARE_STORAGE_BUCKET,
			Key: uniqueIdentifier,
		}),
	);
};
