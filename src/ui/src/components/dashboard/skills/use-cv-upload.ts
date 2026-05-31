import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { MAX_FILE_SIZE_CV } from '@/lib/constants';
import { useCreateProfileFromResume } from '@/query/profile.query';

export function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useCvUpload() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const { mutateAsync, isPending: isUploading } = useCreateProfileFromResume();
	const navigate = useNavigate();

	const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const resume = e.target.files?.[0] ?? null;
		e.target.value = '';
		if (!resume) return;
		if (resume.size > MAX_FILE_SIZE_CV) {
			toast.error('File exceeds maximum size of 2MB');
			return;
		}
		if (resume.type !== 'application/pdf') {
			toast.error('Only PDFs are allowed for upload');
			return;
		}
		setSelectedFile(resume);
	};

	const onConfirm = (successMessage = 'CV uploaded successfully') => {
		if (!selectedFile) return;
		const formData = new FormData();
		formData.append('resume', selectedFile);
		mutateAsync(formData)
			.then((res) => {
				toast.success(res?.message ?? successMessage);
				setSelectedFile(null);
				navigate('/skills/review', {
					state: {
						structuredData: res.structuredData,
						skillMatchMeta: res.skillMatchMeta,
					},
				});
			})
			.catch((error: Error) => {
				toast.error(error.message ?? 'Upload failed — please try again');
			});
	};

	return {
		selectedFile,
		setSelectedFile,
		isUploading,
		onFileChange,
		onConfirm,
	};
}
