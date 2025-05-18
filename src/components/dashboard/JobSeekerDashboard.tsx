import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardTabs from "./tabs/DashboardTabs";
import ProfileSection from "./profile/ProfileSection";
import JobListSection from "./jobs/JobListSection";
import ApplicationsList from "./applications/ApplicationsList";
import AIJobMatchesSection from "./jobs/AIJobMatchesSection";
import { JobApplication, Job } from "@/types/job";
import ApplyForm from "./ApplyForm";
import { calculateCosineSimilarity } from "@/utils/skillsAnalysis";
import { motion } from "framer-motion";

interface JobSeekerDashboardProps {
  profile: any;
}

const JobSeekerDashboard = ({ profile }: JobSeekerDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'listings' | 'applications' | 'profile'>('listings');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplyFormOpen, setIsApplyFormOpen] = useState(false);
  const [resumeText, setResumeText] = useState<string>("");
  
  // Effect to initialize resume text for AI job matching if profile has a resume URL
  useEffect(() => {
    const fetchResumeText = async () => {
      if (profile?.resume_url) {
        try {
          // If we previously stored resume text in session storage (to avoid re-processing)
          const cachedResumeText = sessionStorage.getItem(`resume_text_${profile.id}`);
          if (cachedResumeText) {
            setResumeText(cachedResumeText);
            return;
          }
          
          // Try to get processed resume text from Supabase function
          const { data, error } = await supabase.functions.invoke('extract-resume-text', {
            body: { resumeUrl: profile.resume_url }
          });
          
          if (error) throw error;
          
          if (data?.text) {
            setResumeText(data.text);
            // Cache the result to avoid repeated processing
            sessionStorage.setItem(`resume_text_${profile.id}`, data.text);
          }
        } catch (error) {
          console.error('Error extracting resume text:', error);
        }
      }
    };
    
    fetchResumeText();
  }, [profile]);

  // Fetch job seeker's applications
  const { data: applications, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery({
    queryKey: ["jobseeker-applications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          job:jobs(*)
        `)
        .eq("applicant_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error loading applications",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data as JobApplication[];
    },
    enabled: !!user?.id,
  });

  // Fetch all available jobs for job seeker to apply
  const { data: availableJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["available-jobs"],
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

  // Fetch user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsApplyFormOpen(true);
  };

  const handleApplyFormSubmit = async (coverLetter: string, resumeUrl: string | null, parsedResumeText: string) => {
    if (!user || !selectedJob) return;
    
    try {
      // Save the resume text for AI job matching
      setResumeText(parsedResumeText);
      
      // Calculate similarity score between resume and job description
      const similarityScore = calculateCosineSimilarity(
        parsedResumeText,
        `${selectedJob.description} ${selectedJob.requirements}`
      );
      
      // Convert to a percentage and round to 2 decimal places
      const atsScore = Math.round(similarityScore * 100);
      
      const { error } = await supabase.from("applications").insert({
        job_id: selectedJob.id,
        applicant_id: user.id,
        cover_letter: coverLetter,
        resume_url: resumeUrl,
        ats_score: atsScore,
        status: "pending"
      });
      
      if (error) throw error;
      
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully!",
      });
      
      setIsApplyFormOpen(false);
      refetchApplications();
      setActiveTab('applications');
      
    } catch (error: any) {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-1">Job Seeker Dashboard</h1>
        <p className="text-muted-foreground">Find opportunities and track your applications.</p>
      </motion.div>
      
      {/* AI Job Matches Section - Show regardless of whether resumeText is available */}
      <AIJobMatchesSection 
        profile={profileData} 
        resumeUrl={profileData?.resume_url} 
        resumeText={resumeText}
        onRefreshApplications={refetchApplications}
      />
      
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'listings' && (
        <motion.section 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-semibold">Available Jobs</h2>
          <JobListSection 
            jobs={availableJobs || []} 
            isLoading={jobsLoading} 
            onApplyClick={handleApplyClick}
          />
        </motion.section>
      )}
      
      {activeTab === 'applications' && (
        <motion.section 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-semibold">Your Applications</h2>
          <ApplicationsList 
            applications={applications || []}
            isLoading={applicationsLoading} 
          />
        </motion.section>
      )}

      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <ProfileSection 
            profile={profileData}
            isLoading={profileLoading}
            resumeText={resumeText}
          />
        </motion.div>
      )}

      {isApplyFormOpen && selectedJob && (
        <ApplyForm
          job={selectedJob}
          onClose={() => setIsApplyFormOpen(false)}
          onSubmit={handleApplyFormSubmit}
        />
      )}
    </div>
  );
};

export default JobSeekerDashboard;
