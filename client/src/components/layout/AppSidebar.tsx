import { FileText, Home, Settings, User, LogOut, Activity, BarChart3, Download, ChevronDown, BookOpen } from "lucide-react";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { Link, useLocation } from "wouter";

const navigation = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "Templates", icon: FileText, href: "/templates" },
  { name: "Created Files", icon: Download, href: "/generated-pdfs" },
  { name: "User Guide", icon: BookOpen, href: "/user-guide" },
];

const secondaryNavigation = [
  { name: "Analytics", icon: BarChart3, href: "/analytics", badge: "Pro" },
  { name: "Activity", icon: Activity, href: "/activity" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { profile } = useProfiles();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string) => location === href;

  const getUserInitials = () => {
    const name = profile?.display_name || user?.user_metadata?.name || user?.email || "";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getDisplayName = () => {
    return profile?.display_name || user?.user_metadata?.name || "User";
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-3 lg:p-4 pt-2 lg:pt-3">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className="p-1.5 lg:p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
            <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">DocCraft</h1>
            <p className="text-sm lg:text-base text-gray-500">PDF Generator</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 lg:px-4 overflow-y-auto scrollbar-none">
        <div>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm lg:text-base font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              Main Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.href)}
                      className={`h-10 lg:h-11 rounded-lg transition-all duration-200 text-sm lg:text-base font-medium ${
                        isActive(item.href) 
                          ? 'bg-blue-600 text-white shadow-md border-blue-600' 
                          : 'hover:bg-blue-50 hover:text-blue-700 text-gray-700 hover:border-blue-200'
                      }`}
                    >
                      <Link to={item.href} className="flex items-center space-x-3 px-3 lg:px-4">
                        <item.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-4" />

          <SidebarGroup>
            <SidebarGroupLabel className="text-sm lg:text-base font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              Tools & Settings
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {secondaryNavigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.href)}
                      className={`h-10 lg:h-11 rounded-lg transition-all duration-200 text-sm lg:text-base font-medium ${
                        isActive(item.href) 
                          ? 'bg-blue-600 text-white shadow-md border-blue-600' 
                          : 'hover:bg-blue-50 hover:text-blue-700 text-gray-700 hover:border-blue-200'
                      }`}
                    >
                      <Link to={item.href} className="flex items-center justify-between px-3 lg:px-4">
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarSeparator />
      
      <SidebarFooter className="p-3 lg:p-4">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 lg:p-4 border border-gray-200 shadow-lg">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full h-auto p-0 justify-start hover:bg-transparent">
                <div className="flex items-center space-x-3 w-full">
                  <Avatar className="h-8 w-8 lg:h-10 lg:w-10 bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={getDisplayName()} />
                    )}
                    <AvatarFallback className="text-white text-xs lg:text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm lg:text-base font-medium text-gray-900 truncate">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
