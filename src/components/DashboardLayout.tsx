
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Search, User, LogOut, Menu, X 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Fetch user profile to determine role
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const NavItem = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = location.pathname === href;
    
    return (
      <Button
        variant={isActive ? "default" : "ghost"}
        className="h-10"
        asChild
      >
        <Link to={href}>{children}</Link>
      </Button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-medium text-lg">J</span>
            </div>
            <span className="font-medium text-xl hidden md:inline">JobNect</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavItem href="/dashboard">Dashboard</NavItem>
            {profile?.role === "job_seeker" ? (
              <>
                <NavItem href="/jobs">Jobs</NavItem>
              </>
            ) : null}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="pl-9 pr-4 py-2 w-[250px] bg-secondary/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <User className="h-4 w-4" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className="hidden md:flex gap-2 h-10 hover:bg-accent/50 transition-colors" 
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="p-4 space-y-2">
            <NavItem href="/dashboard">Dashboard</NavItem>
            
            {profile?.role === "job_seeker" ? (
              <>
                <NavItem href="/jobs">Jobs</NavItem>
              </>
            ) : null}
            
            <form onSubmit={handleSearch} className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="pl-9 pr-4 py-2 w-full bg-secondary/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            <div className="pt-2 border-t border-border mt-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 h-10 text-destructive hover:bg-destructive/10" 
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </nav>
        </div>
      )}
      
      {/* Dashboard Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
