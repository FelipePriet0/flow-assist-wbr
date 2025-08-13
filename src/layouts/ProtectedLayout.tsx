import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MockModeToggle } from "@/components/MockModeToggle";
import { Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  return (
    <SidebarProvider>
      <header className="h-12 flex items-center justify-between border-b px-4">
        <SidebarTrigger className="ml-2" />
        <MockModeToggle />
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
