
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      href: "/dashboard",
    },
    {
      label: "Classes",
      icon: <Calendar size={20} />,
      href: "/classes",
    },
    {
      label: "Reports",
      icon: <FileText size={20} />,
      href: "/reports",
    },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground h-16 border-b shadow-sm flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden mr-2"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
            <h1 className="text-xl font-bold">Attendance System</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="hidden md:inline">
                  {user.name}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => logout()}
                  className="flex items-center gap-2"
                >
                  <LogOut size={18} />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={cn(
            "bg-card border-r w-64 shrink-0 overflow-y-auto flex-col md:flex",
            sidebarOpen ? "fixed inset-y-0 left-0 z-50 flex pt-16" : "hidden"
          )}
        >
          <nav className="flex flex-col flex-1 p-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "justify-start w-full",
                    location.pathname === item.href && "bg-accent"
                  )}
                  onClick={() => {
                    navigate(item.href);
                    if (sidebarOpen) setSidebarOpen(false);
                  }}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
