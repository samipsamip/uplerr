import AppSidebar from '@/components/dashboard/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<TooltipProvider>
			<SidebarProvider className="h-svh overflow-hidden">
				<AppSidebar variant="inset" />
				<main className="bg-muted flex flex-1 flex-col overflow-auto">
					{children}
				</main>
			</SidebarProvider>
		</TooltipProvider>
	);
}
