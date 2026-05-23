import { useState } from 'react';
import { FileText, Loader2, ShieldCheck, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { MAX_FILE_SIZE_CV } from '@/lib/constants';
import { useUpdateResume } from '@/query/skills.query';

export interface CvFile {
	name: string;
	uploadedAt: string;
	skillsExtracted: number;
}

interface CvCardProps {
	cvFile: CvFile;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CvCard({ cvFile }: CvCardProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const { mutateAsync } = useUpdateResume();

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
				toast.success(res?.message ?? 'CV replaced successfully');
				setSelectedFile(null);
			})
			.catch((error: Error) => {
				toast.error(error.message ?? 'Upload failed — please try again');
			})
			.finally(() => setIsUploading(false));
	};

	return (
		<div className="flex flex-col">
			<input
				id="replace-cv"
				type="file"
				accept="application/pdf"
				hidden
				onChange={onFileChange}
			/>
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="bg-accent/[0.08] flex size-10 shrink-0 items-center justify-center rounded-xl">
						<FileText className="text-accent size-5" />
					</div>
					<div>
						<p className="text-base font-medium">{cvFile.name}</p>
						<p className="text-muted-foreground mt-0.5 text-xs">
							Uploaded {cvFile.uploadedAt} &middot; {cvFile.skillsExtracted}{' '}
							skills extracted
						</p>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-3">
					<span className="text-accent flex items-center gap-1 text-xs">
						<ShieldCheck className="size-4" />
						Verified
					</span>
					{!selectedFile && (
						<Button variant="outline" size="sm" className="gap-1.5" asChild>
							<label htmlFor="replace-cv">
								<Upload className="size-3.5" />
								Replace
							</label>
						</Button>
					)}
				</div>
			</div>

			{selectedFile && (
				<div className="border-border/40 mt-3 flex items-center justify-between gap-4 border-t pt-3">
					<div className="flex items-center gap-3">
						<div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
							<FileText className="text-muted-foreground size-4" />
						</div>
						<div>
							<p className="text-sm font-medium">{selectedFile.name}</p>
							<p className="text-muted-foreground mt-0.5 text-xs">
								{formatFileSize(selectedFile.size)} · Ready to replace
							</p>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setSelectedFile(null)}
							disabled={isUploading}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							className="gap-1.5"
							onClick={onConfirm}
							disabled={isUploading}
						>
							{isUploading && <Loader2 className="size-3.5 animate-spin" />}
							{isUploading ? 'Uploading…' : 'Confirm Replace'}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
