import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuthFormShellProps {
	imageSrc: string;
	imageAlt: string;
	className?: string;
	children: React.ReactNode;
}

export function AuthFormShell({
	imageSrc,
	imageAlt,
	className,
	children,
}: AuthFormShellProps) {
	return (
		<div className={cn('flex flex-col gap-6', className)}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2">
					<div className="p-6 md:p-8">{children}</div>
					<div className="bg-muted relative hidden overflow-hidden md:block">
						<img
							src={imageSrc}
							alt={imageAlt}
							className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
