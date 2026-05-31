import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PdfDebugPage() {
	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [text, setText] = useState('');
	const [links, setLinks] = useState<string[]>([]);
	const [error, setError] = useState('');
	const [copied, setCopied] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) return;

		setLoading(true);
		setError('');
		setText('');
		setLinks([]);

		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await fetch('http://localhost:3000/api/debug/parse-pdf', {
				method: 'POST',
				body: formData,
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.message ?? 'Something went wrong');
				return;
			}
			setText(data.text ?? '');
			setLinks(data.links ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Network error');
		} finally {
			setLoading(false);
		}
	};

	const copy = async (content: string, key: string) => {
		await navigator.clipboard.writeText(content);
		setCopied(key);
		setTimeout(() => setCopied(null), 2000);
	};

	const hasContent = text || links.length > 0;

	return (
		<div className="mx-auto max-w-4xl space-y-6 p-8">
			<h1 className="text-3xl font-semibold tracking-tight">
				PDF Parser Debug
			</h1>

			<Card className="border-border/60 bg-card rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
				<CardContent className="p-5">
					<form onSubmit={handleSubmit} className="flex items-center gap-3">
						<input
							type="file"
							accept="application/pdf"
							onChange={(e) => setFile(e.target.files?.[0] ?? null)}
							className="text-muted-foreground file:bg-muted file:text-foreground text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-medium"
						/>
						<Button type="submit" disabled={!file || loading}>
							{loading ? 'Parsing…' : 'Parse PDF'}
						</Button>
					</form>
				</CardContent>
			</Card>

			{error && <p className="text-destructive text-sm">{error}</p>}

			{hasContent && (
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => copy(text, 'text')}
					>
						{copied === 'text' ? (
							<Check className="mr-1.5 size-3.5" />
						) : (
							<Copy className="mr-1.5 size-3.5" />
						)}
						Copy Parsed Text
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => copy(links.join('\n'), 'links')}
					>
						{copied === 'links' ? (
							<Check className="mr-1.5 size-3.5" />
						) : (
							<Copy className="mr-1.5 size-3.5" />
						)}
						Copy Links
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => copy(`${text}\n\n---\n\n${links.join('\n')}`, 'all')}
					>
						{copied === 'all' ? (
							<Check className="mr-1.5 size-3.5" />
						) : (
							<Copy className="mr-1.5 size-3.5" />
						)}
						Copy Text + Links
					</Button>
				</div>
			)}

			{text && (
				<Card className="border-border/60 bg-card rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
					<CardContent className="space-y-2 p-5">
						<p className="text-muted-foreground text-xs">Extracted Text</p>
						<textarea
							readOnly
							value={text}
							className="bg-muted/40 border-border/50 h-96 w-full resize-none rounded-lg border p-3 font-mono text-xs focus:outline-none"
						/>
					</CardContent>
				</Card>
			)}

			{links.length > 0 && (
				<Card className="border-border/60 bg-card rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
					<CardContent className="space-y-2 p-5">
						<p className="text-muted-foreground text-xs">Links</p>
						<textarea
							readOnly
							value={links.join('\n')}
							className="bg-muted/40 border-border/50 h-28 w-full resize-none rounded-lg border p-3 font-mono text-xs focus:outline-none"
						/>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
