import AppSidebar from '@/components/dashboard/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<TooltipProvider>
			<SidebarProvider>
				<AppSidebar variant="inset" />
				<main className="flex flex-1 flex-col bg-muted">{children}</main>
			</SidebarProvider>
		</TooltipProvider>
	);
}
