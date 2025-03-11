import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, Users, BriefcaseBusiness, BarChart, Settings, Bell, Search, 
  PlusCircle, User, LogOut, Mail, FileText, Briefcase, Bookmark
} from "lucide-react";
import { JobCard } from "@/components/JobCard";

const Dashboard = () => {
  const [role] = useState<"employer" | "employee">("employee");

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border p-4">
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-medium text-lg">J</span>
          </div>
          <span className="font-medium text-xl">JobNect</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 h-10">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          
          {role === "employee" ? (
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
          <Button variant="ghost" className="w-full justify-start gap-3 h-10">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-10">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
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
                className="pl-9 pr-4 py-2 w-full md:w-[300px] bg-secondary/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Mail className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Welcome back, Alex</h1>
            <p className="text-muted-foreground">Here's what's happening with your job search today.</p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {role === "employee" ? (
              <>
                <div className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-muted-foreground">Applications</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-muted-foreground">4 in review</div>
                </div>
                <div className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-muted-foreground">Saved Jobs</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bookmark className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-xs text-muted-foreground">8 new this week</div>
                </div>
                <div className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-muted-foreground">Profile Views</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">187</div>
                  <div className="text-xs text-muted-foreground">↑ 23% from last month</div>
                </div>
                <div className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-muted-foreground">Messages</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">6</div>
                  <div className="text-xs text-muted-foreground">3 unread</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-muted-foreground">Active Jobs</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <BriefcaseBusiness className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-xs text-muted-foreground">2 about to expire</div>
                </div>
                <div className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-muted-foreground">Applications</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-xs text-muted-foreground">42 in review</div>
                </div>
                <div className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-muted-foreground">Candidates</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">38</div>
                  <div className="text-xs text-muted-foreground">12 shortlisted</div>
                </div>
                <div className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-muted-foreground">Messages</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-xs text-muted-foreground">8 unread</div>
                </div>
              </>
            )}
          </div>
          
          {/* Recent/Recommended Jobs */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {role === "employee" ? "Recommended Jobs" : "Recent Job Postings"}
              </h2>
              {role === "employer" && (
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  id: "1",
                  title: "Senior UX Designer",
                  company: "Apple Inc.",
                  location: "San Francisco, CA",
                  salary: "$120k - $150k",
                  type: "Full-time",
                  postedAt: "2 days ago",
                  featured: true
                },
                {
                  id: "2",
                  title: "Front-end Developer",
                  company: "Google",
                  location: "Remote",
                  salary: "$90k - $120k",
                  type: "Full-time",
                  postedAt: "1 week ago"
                },
                {
                  id: "3",
                  title: "Product Marketing Manager",
                  company: "Meta",
                  location: "New York, NY",
                  salary: "$110k - $130k",
                  type: "Full-time",
                  postedAt: "3 days ago"
                }
              ].map((job) => (
                <JobCard key={job.id} {...job} />
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <Button variant="outline">View All Jobs</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
