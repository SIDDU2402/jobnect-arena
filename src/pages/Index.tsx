
import { NavBar } from "@/components/NavBar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, User, Bookmark, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-1">
        <Hero />
        <Features />
        
        {/* How It Works Section */}
        <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background to-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How JobNect Works</h2>
              <p className="text-lg text-muted-foreground">
                A simple and efficient process designed to connect employers with the perfect candidates.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <User className="h-10 w-10 text-primary" />,
                  title: "Create Your Profile",
                  description: "Sign up and build your profile with skills, experience, and resume. For employers, create your company profile."
                },
                {
                  icon: <Briefcase className="h-10 w-10 text-primary" />,
                  title: "Post or Apply for Jobs",
                  description: "Employers can post job listings while job seekers can search and apply for relevant opportunities."
                },
                {
                  icon: <Users className="h-10 w-10 text-primary" />,
                  title: "Connect and Hire",
                  description: "Review applications, schedule interviews, and make hiring decisions all within the platform."
                }
              ].map((step, index) => (
                <div 
                  key={index}
                  className="glass-panel p-8 rounded-xl text-center relative overflow-hidden"
                >
                  <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">{index + 1}</span>
                  </div>
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-medium mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/30 to-background"></div>
          <div className="container mx-auto px-4 md:px-6">
            <div className="glass-panel p-8 md:p-12 rounded-2xl max-w-5xl mx-auto relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-2xl"></div>
              
              <div className="relative text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Hiring Process?</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Join thousands of companies and job seekers who are already experiencing the future of recruitment.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="group">
                    <Link to="/register">
                      Get Started
                      <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/jobs">Browse Jobs</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
