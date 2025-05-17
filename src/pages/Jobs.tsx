
import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import JobListSection from "@/components/dashboard/jobs/JobListSection";
import { Job } from "@/types/job";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const Jobs = () => {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["public-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error loading jobs",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data as Job[];
    },
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <motion.main 
        className="flex-1 pt-24 pb-20 px-4 md:px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Discover Your Next Opportunity</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse through our curated list of job opportunities from top employers in various industries.
            </p>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="space-y-8"
          >
            <JobListSection jobs={jobs || []} isLoading={isLoading} />
          </motion.div>
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Jobs;
