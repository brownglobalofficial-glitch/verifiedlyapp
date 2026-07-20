import { NavLink, useNavigate } from "react-router-dom";
import { User, ShieldCheck, Settings, LogOut, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import logoMark from "@/assets/verifiedly-mark.png";

const items = [
  { title: "My profile", url: "/dashboard", icon: User, end: true },
  { title: "Verify identity", url: "/dashboard/verification", icon: ShieldCheck },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function DashboardSidebar({ username }: { username?: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center justify-center">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <img src={logoMark} alt="Verifiedly" className="h-7 w-7" />
          {!collapsed && <span className="font-display font-semibold text-sm">Verifiedly</span>}
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2 ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {username && !collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick links</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href={`/${username}`} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>View public profile</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}