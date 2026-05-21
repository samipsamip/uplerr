import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface TopBarProps {
	title: string;
	description?: string;
	action?: React.ReactNode;
}

export function TopBar({ title, description, action }: TopBarProps) {
	return (
		<header className="sticky top-0 z-10 flex h-16 shrink-0 items-stretch gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
			<div className="flex items-center">
				<SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
			</div>
			<Separator orientation="vertical" />
			<div className="flex flex-1 items-center justify-between gap-4">
				<div>
					<h1 className="font-semibold leading-none">{title}</h1>
					{description && (
						<p className="mt-1 text-xs text-muted-foreground">{description}</p>
					)}
				</div>
				{action && <div className="shrink-0">{action}</div>}
			</div>
		</header>
	);
}
