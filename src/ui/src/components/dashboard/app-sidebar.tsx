import type { LucideIcon } from 'lucide-react';
import { Briefcase, LayoutDashboard, Route, Zap } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import useAuthUser from '@/hooks/use-auth-user';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '../ui/sidebar';
import { NavUser } from './user-navigation';

const navItems: {
	label: string;
	href?: string;
	onSelect?: () => void;
	icon: LucideIcon;
}[] = [
	{
		label: 'Dashboard',
		href: '/dashboard',
		icon: LayoutDashboard,
	},
	{
		label: 'Roadmaps',
		href: '/roadmaps',
		icon: Route,
	},
	{
		label: 'Skills & CV',
		href: '/skills',
		icon: Briefcase,
	},
];

export default function AppSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const location = useLocation();
	const { isMobile, setOpenMobile } = useSidebar();
	const { name, email, image } = useAuthUser();
	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<NavLink to="/dashboard">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background">
									<Zap className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5 leading-none">
									<span className="font-semibold tracking-tight">Uplerr</span>
									<span className="text-xs text-muted-foreground">
										Learning. Simplified.
									</span>
								</div>
							</NavLink>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel />
					<SidebarGroupContent>
						<SidebarMenu className="gap-1">
							{navItems.map((item) => {
								const isActive = item.href
									? location.pathname === item.href
									: false;
								return (
									<SidebarMenuItem key={item.label}>
										<SidebarMenuButton
											asChild={!!item.href}
											isActive={isActive}
											tooltip={item.label}
											className="h-10 rounded-xl data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
											onClick={() => {
												item.onSelect?.();
												if (isMobile) setOpenMobile(false);
											}}
										>
											{item.href ? (
												<NavLink to={item.href}>
													<item.icon
														className={
															isActive ? 'text-accent' : 'text-muted-foreground'
														}
													/>
													<span>{item.label}</span>
												</NavLink>
											) : (
												<>
													<item.icon
														className={
															isActive ? 'text-accent' : 'text-muted-foreground'
														}
													/>
													<span>{item.label}</span>
												</>
											)}
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<NavUser user={{ name, email, avatar: image || undefined }} />
			</SidebarFooter>
		</Sidebar>
	);
}
