
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  LayoutDashboard, Users, BriefcaseBusiness, BarChart, Settings, Bell, Search, 
  PlusCircle, User, LogOut, Mail, FileText, Briefcase, Bookmark
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  return (
    <div className="min-h-screen flex bg-background transition-colors duration-300">
      {/* Sidebar with animation */}
      <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border p-4 animate-slide-in">
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center animate-pulse-light">
            <span className="text-primary-foreground font-medium text-lg">J</span>
          </div>
          <span className="font-medium text-xl text-gradient">JobNect</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 h-10">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          
          {userProfile?.role === "job_seeker" ? (
            <>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                <Briefcase className="h-4 w-4" />
                Jobs
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                <FileText className="h-4 w-4" />
                Applications
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                <Bookmark className="h-4 w-4" />
                Saved Jobs
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                <Mail className="h-4 w-4" />
                Messages
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                <BriefcaseBusiness className="h-4 w-4" />
                Job Listings
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                <Users className="h-4 w-4" />
                Candidates
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                <BarChart className="h-4 w-4" />
                Analytics
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                <Mail className="h-4 w-4" />
                Messages
              </Button>
            </>
          )}
        </nav>
        
        <div className="pt-2 border-t border-border space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:bg-accent/50 transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:bg-accent/50 transition-colors" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with glass effect */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10 transition-all duration-300">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </Button>
            <div className="relative md:ml-4 lg:ml-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 w-full md:w-[300px] bg-secondary/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <User className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content with animation */}
        <main className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
