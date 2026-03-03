import { ClipboardList, ChefHat, BarChart3, UtensilsCrossed, Users, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { hasRole, signOut, user } = useAuth();

  const mainItems = [
    { title: "Pedidos", url: "/orders", icon: ClipboardList },
    { title: "Novo Pedido", url: "/orders/new", icon: ChefHat },
  ];

  const adminItems = [
    { title: "Cardápio", url: "/menu", icon: UtensilsCrossed, roles: ["admin"] as const },
    { title: "Estatísticas", url: "/stats", icon: BarChart3, roles: ["admin"] as const },
    { title: "Usuários", url: "/users", icon: Users, roles: ["admin"] as const },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {!collapsed && (
          <div className="px-4 py-5">
            <h1 className="text-lg font-bold text-sidebar-primary-foreground">
              🍔 DeMattos Lanches
            </h1>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Operações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasRole("admin") && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && user && (
          <div className="px-3 pb-2 text-xs text-sidebar-foreground/60 truncate">
            {user.email}
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={signOut}
          className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
