import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { formatFileSize } from '@/components/dashboard/skills/use-cv-upload';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/query/profile.query', () => ({
	useCreateProfileFromResume: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
}));

function wrapper({ children }: { children: React.ReactNode }) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return (
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>{children}</MemoryRouter>
		</QueryClientProvider>
	);
}

// ── formatFileSize ─────────────────────────────────────────────────────────────

describe('formatFileSize', () => {
	it('formats bytes under 1 MB as KB', () => {
		expect(formatFileSize(512 * 1024)).toBe('512 KB');
	});

	it('formats bytes at or over 1 MB as MB', () => {
		expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
	});

	it('formats exactly 1 MB as MB', () => {
		expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
	});
});

// ── useCvUpload ────────────────────────────────────────────────────────────────

describe('useCvUpload — onFileChange validation', () => {
	it('rejects files that are not PDFs', async () => {
		const { toast } = await import('sonner');
		const { useCvUpload } =
			await import('@/components/dashboard/skills/use-cv-upload');
		const { result } = renderHook(() => useCvUpload(), { wrapper });

		const notPdf = new File(['data'], 'doc.docx', {
			type: 'application/msword',
		});
		const event = {
			target: { files: [notPdf], value: '' },
		} as unknown as React.ChangeEvent<HTMLInputElement>;

		act(() => {
			result.current.onFileChange(event);
		});

		expect(toast.error).toHaveBeenCalledWith(
			'Only PDFs are allowed for upload',
		);
		expect(result.current.selectedFile).toBeNull();
	});

	it('rejects files that exceed 2 MB', async () => {
		const { toast } = await import('sonner');
		const { useCvUpload } =
			await import('@/components/dashboard/skills/use-cv-upload');
		const { result } = renderHook(() => useCvUpload(), { wrapper });

		const bigFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'big.pdf', {
			type: 'application/pdf',
		});
		const event = {
			target: { files: [bigFile], value: '' },
		} as unknown as React.ChangeEvent<HTMLInputElement>;

		act(() => {
			result.current.onFileChange(event);
		});

		expect(toast.error).toHaveBeenCalledWith(
			'File exceeds maximum size of 2MB',
		);
		expect(result.current.selectedFile).toBeNull();
	});

	it('accepts a valid PDF under 2 MB', async () => {
		const { useCvUpload } =
			await import('@/components/dashboard/skills/use-cv-upload');
		const { result } = renderHook(() => useCvUpload(), { wrapper });

		const validPdf = new File(['%PDF-1.4'], 'cv.pdf', {
			type: 'application/pdf',
		});
		const event = {
			target: { files: [validPdf], value: '' },
		} as unknown as React.ChangeEvent<HTMLInputElement>;

		act(() => {
			result.current.onFileChange(event);
		});

		expect(result.current.selectedFile).toBe(validPdf);
	});

	it('ignores change events with no files', async () => {
		const { useCvUpload } =
			await import('@/components/dashboard/skills/use-cv-upload');
		const { result } = renderHook(() => useCvUpload(), { wrapper });

		const event = {
			target: { files: [], value: '' },
		} as unknown as React.ChangeEvent<HTMLInputElement>;

		act(() => {
			result.current.onFileChange(event);
		});

		expect(result.current.selectedFile).toBeNull();
	});
});

describe('useCvUpload — onConfirm', () => {
	it('does nothing when no file is selected', async () => {
		const { useCreateProfileFromResume } =
			await import('@/query/profile.query');
		const mutateMock = vi.fn();
		vi.mocked(useCreateProfileFromResume).mockReturnValue({
			mutateAsync: mutateMock,
			isPending: false,
		} as unknown as ReturnType<typeof useCreateProfileFromResume>);

		const { useCvUpload } =
			await import('@/components/dashboard/skills/use-cv-upload');
		const { result } = renderHook(() => useCvUpload(), { wrapper });

		await act(async () => {
			result.current.onConfirm();
		});

		expect(mutateMock).not.toHaveBeenCalled();
	});

	it('shows toast error when upload fails', async () => {
		const { toast } = await import('sonner');
		const { useCreateProfileFromResume } =
			await import('@/query/profile.query');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(useCreateProfileFromResume).mockReturnValue({
			mutateAsync: vi.fn().mockRejectedValue(new Error('Upload failed')),
			isPending: false,
		} as any);

		const { useCvUpload } =
			await import('@/components/dashboard/skills/use-cv-upload');
		const { result } = renderHook(() => useCvUpload(), { wrapper });

		const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
		act(() => {
			result.current.setSelectedFile(file);
		});

		await act(async () => {
			result.current.onConfirm();
		});

		expect(toast.error).toHaveBeenCalledWith('Upload failed');
	});
});
