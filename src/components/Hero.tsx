
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Briefcase, Users } from "lucide-react";

export const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-blur-in");
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden pt-16" ref={heroRef}>
      {/* Background Elements */}
      <div className="blur-backdrop"></div>
      <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-12 -right-32 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl"></div>
      
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 max-w-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <span className="animate-pulse-light">•</span>
                <span className="ml-2">The Future of Hiring</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
                Connect with your <span className="text-gradient">dream career</span> opportunity
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mt-4 text-balance">
                An intelligent job portal that connects employers with talent through AI-powered matching and a seamless user experience.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="group">
                <Link to="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/jobs">Browse Jobs</Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">2000+</span>
                <span className="text-muted-foreground text-sm">Jobs Posted</span>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">800+</span>
                <span className="text-muted-foreground text-sm">Companies</span>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">15k+</span>
                <span className="text-muted-foreground text-sm">Candidates</span>
              </div>
            </div>
          </div>
          
          <div className="relative hidden md:block">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/10 rounded-2xl blur-xl opacity-70"></div>
            <div className="glass-panel p-8 relative">
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-xl font-medium">Recent Opportunities</h3>
                <Button variant="ghost" size="sm" className="text-primary h-8">View all</Button>
              </div>
              
              {[
                {
                  title: "Product Designer",
                  company: "Apple Inc.",
                  location: "San Francisco, CA",
                  icon: <Search className="h-5 w-5 text-primary" />
                },
                {
                  title: "Senior React Developer",
                  company: "Google",
                  location: "Remote",
                  icon: <Briefcase className="h-5 w-5 text-primary" />
                },
                {
                  title: "Marketing Manager",
                  company: "Meta",
                  location: "New York, NY",
                  icon: <Users className="h-5 w-5 text-primary" />
                }
              ].map((job, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-background mb-3 flex items-center gap-4 transition-all hover:shadow-sm hover:translate-x-1 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {job.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{job.title}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{job.company}</span>
                      <span className="mx-2">•</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
