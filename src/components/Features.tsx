
import { useState, useEffect, useRef } from "react";
import { CheckCircle, BriefcaseBusiness, UserCheck, BrainCircuit, FileSearch } from "lucide-react";

export const Features = () => {
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-scale-in");
            entry.target.classList.add("opacity-100");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
    );

    featureRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      featureRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);
  
  const features = [
    {
      icon: <BriefcaseBusiness className="h-8 w-8 text-primary" />,
      title: "Job Management",
      description: "Post, edit, and manage job listings with ease. Track applications and communicate with candidates all in one place."
    },
    {
      icon: <UserCheck className="h-8 w-8 text-primary" />,
      title: "Talent Discovery",
      description: "Find and connect with top talent. Review applications, schedule interviews, and make hiring decisions effortlessly."
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: "AI-Powered Matching",
      description: "Our intelligent matching algorithm connects the right candidates with the right opportunities based on skills and experience."
    },
    {
      icon: <FileSearch className="h-8 w-8 text-primary" />,
      title: "Resume Scoring",
      description: "AI evaluates resumes based on job requirements, providing insights into candidate qualifications and fit."
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden" id="features">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Streamlined Hiring Experience</h2>
          <p className="text-lg text-muted-foreground">
            Discover how JobNect transforms the hiring process with powerful features for both employers and job seekers.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              ref={(el) => (featureRefs.current[index] = el)}
              className="glass-panel p-6 rounded-xl opacity-0 transition-all duration-500"
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="text-xl font-medium mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-24">
          <div className="glass-panel p-8 md:p-12 rounded-2xl max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-6">Everything you need to optimize your hiring process</h3>
                <div className="space-y-4">
                  {[
                    "Post unlimited job listings",
                    "AI-powered candidate matching",
                    "Resume scoring and analysis",
                    "Real-time application tracking",
                    "Seamless interview scheduling"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/5 rounded-xl blur-xl opacity-70"></div>
                <div className="relative bg-white bg-opacity-60 backdrop-blur-md rounded-xl overflow-hidden shadow-soft p-1">
                  <img 
                    src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d" 
                    alt="Dashboard Preview" 
                    className="rounded-lg w-full h-auto object-cover" 
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
