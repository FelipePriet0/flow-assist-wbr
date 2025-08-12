import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  return (
    <SidebarProvider>
      <header className="h-12 flex items-center border-b">
        <SidebarTrigger className="ml-2" />
      </header>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
