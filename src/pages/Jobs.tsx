
import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import JobListSection from "@/components/dashboard/jobs/JobListSection";
import { Job } from "@/types/job";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { SearchIcon, BriefcaseIcon, MapPinIcon, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Jobs = () => {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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

  // Filter jobs based on search term and filters
  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = searchTerm === "" || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesLocation = locationFilter === "" || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase());
      
    const matchesType = typeFilter === "" || job.type === typeFilter;
    
    return matchesSearch && matchesLocation && matchesType;
  });

  // Get unique job locations for filter
  const uniqueLocations = [...new Set(jobs?.map(job => job.location) || [])];
  
  // Get unique job types for filter
  const uniqueTypes = [...new Set(jobs?.map(job => job.type) || [])];

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
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100,
        damping: 12
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
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="bg-card rounded-xl shadow-md p-6 mb-8 border"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search jobs or keywords..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="relative">
                <Select 
                  value={locationFilter} 
                  onValueChange={setLocationFilter}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="All Locations" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {uniqueLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative">
                <Select 
                  value={typeFilter} 
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <BriefcaseIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="All Job Types" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Job Types</SelectItem>
                    {uniqueTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredJobs?.length || 0} of {jobs?.length || 0} jobs
              </p>
              
              <Button variant="outline" size="sm" onClick={() => {
                setSearchTerm("");
                setLocationFilter("");
                setTypeFilter("");
              }}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="space-y-8"
          >
            <JobListSection jobs={filteredJobs || []} isLoading={isLoading} />
          </motion.div>
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Jobs;
