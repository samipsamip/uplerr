import { FileText, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MAX_FILE_SIZE_CV } from '@/lib/constants';
import { useCreateProfileFromResume } from '@/query/skills.query';

function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CvEmptyState() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const { mutateAsync } = useCreateProfileFromResume();

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

	const onConfirm = () => {
		if (!selectedFile) return;
		setIsUploading(true);
		const formData = new FormData();
		formData.append('resume', selectedFile);
		mutateAsync(formData)
			.then((res) => {
				toast.success(res?.message ?? 'CV uploaded successfully');
				setSelectedFile(null);
			})
			.catch((error: Error) => {
				toast.error(error.message ?? 'Upload failed — please try again');
			})
			.finally(() => setIsUploading(false));
	};

	if (selectedFile) {
		return (
			<div className="flex flex-col items-center gap-3 py-4 text-center">
				<input
					id="upload-cv"
					type="file"
					accept="application/pdf"
					hidden
					onChange={onFileChange}
				/>
				<div className="flex size-10 items-center justify-center rounded-xl bg-accent/[0.08]">
					<FileText className="size-5 text-accent" />
				</div>
				<div>
					<p className="text-base font-medium">{selectedFile.name}</p>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{formatFileSize(selectedFile.size)} · Ready to upload
					</p>
				</div>
				<div className="flex items-center gap-2">
					{isUploading ? (
						<Button variant="ghost" size="sm" disabled>
							Change
						</Button>
					) : (
						<Button variant="ghost" size="sm" asChild>
							<label htmlFor="upload-cv">Change</label>
						</Button>
					)}
					<Button
						size="sm"
						className="gap-1.5"
						onClick={onConfirm}
						disabled={isUploading}
					>
						{isUploading ? (
							<Loader2 className="size-3.5 animate-spin" />
						) : (
							<Upload className="size-3.5" />
						)}
						{isUploading ? 'Uploading…' : 'Upload CV'}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center gap-3 py-6 text-center">
			<input
				id="upload-cv"
				type="file"
				accept="application/pdf"
				hidden
				onChange={onFileChange}
			/>
			<div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
				<Upload className="size-6 text-muted-foreground" />
			</div>
			<div>
				<p className="text-base font-medium">Upload your CV</p>
				<p className="mt-0.5 text-sm text-muted-foreground">
					We'll extract your skills automatically so every roadmap is tailored
					to you.
				</p>
			</div>
			<Button size="sm" className="gap-1.5" asChild>
				<label htmlFor="upload-cv">
					<Upload className="size-3.5" />
					Upload CV
				</label>
			</Button>
		</div>
	);
}
