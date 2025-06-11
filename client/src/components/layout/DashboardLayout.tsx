
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full">
          <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
            <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl pt-4 sm:pt-6 lg:pt-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
