import { useNavigate } from 'react-router';
import {
	Clock,
	Eye,
	FileText,
	Loader2,
	ShieldCheck,
	Upload,
} from 'lucide-react';
import type { CvStructuredData } from '@uppler/types';

import { Button } from '@/components/ui/button';

import { formatFileSize, useCvUpload } from './use-cv-upload';

export interface CvFile {
	name: string;
	uploadedAt: string;
	is_verified: boolean;
	structuredData: CvStructuredData | null;
}

interface CvCardProps {
	cvFile: CvFile;
}

export function CvCard({ cvFile }: CvCardProps) {
	const navigate = useNavigate();
	const {
		selectedFile,
		setSelectedFile,
		isUploading,
		onFileChange,
		onConfirm,
	} = useCvUpload();

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
							Uploaded {cvFile.uploadedAt}
						</p>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-3">
					{cvFile.is_verified ? (
						<span className="text-accent flex items-center gap-1 text-xs">
							<ShieldCheck className="size-4" />
							Verified
						</span>
					) : (
						<span className="text-muted-foreground flex items-center gap-1 text-xs">
							<Clock className="size-3.5" />
							Needs review
						</span>
					)}
					{cvFile.structuredData && (
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5"
							onClick={() =>
								navigate('/skills/review', {
									state: { structuredData: cvFile.structuredData },
								})
							}
						>
							<Eye className="size-3.5" />
							Review
						</Button>
					)}
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
							onClick={() => onConfirm('CV replaced successfully')}
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
