import { FileText, Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { formatFileSize, useCvUpload } from './use-cv-upload';

export function CvEmptyState() {
	const { selectedFile, isUploading, onFileChange, onConfirm } = useCvUpload();

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
				<div className="bg-accent/[0.08] flex size-10 items-center justify-center rounded-xl">
					<FileText className="text-accent size-5" />
				</div>
				<div>
					<p className="text-base font-medium">{selectedFile.name}</p>
					<p className="text-muted-foreground mt-0.5 text-sm">
						{formatFileSize(selectedFile.size)} · Ready to upload
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild disabled={isUploading}>
						<label htmlFor="upload-cv">Change</label>
					</Button>
					<Button
						size="sm"
						className="gap-1.5"
						onClick={() => onConfirm()}
						disabled={isUploading}
						type="button"
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
			<div className="bg-muted flex size-12 items-center justify-center rounded-2xl">
				<Upload className="text-muted-foreground size-6" />
			</div>
			<div>
				<p className="text-base font-medium">Upload your CV</p>
				<p className="text-muted-foreground mt-0.5 text-sm">
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
