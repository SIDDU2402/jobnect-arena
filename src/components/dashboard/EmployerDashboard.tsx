
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardStats from "./stats/DashboardStats";
import DashboardTabs from "./tabs/DashboardTabs";
import JobListingsSection from "./jobs/JobListingsSection";
import ApplicationsSection from "./applications/ApplicationsSection";
import { Job, JobApplication } from "@/types/job";
import { calculateCosineSimilarity } from "@/utils/skillsAnalysis";

interface EmployerDashboardProps {
  profile: any;
}

const EmployerDashboard = ({ profile }: EmployerDashboardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'listings' | 'applications'>('listings');

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["employer-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
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

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["employer-applications"],
    queryFn: async () => {
      const { data: appData, error: appError } = await supabase
        .from("applications")
        .select(`
          *,
          job:jobs(*)
        `)
        .order("created_at", { ascending: false });

      if (appError) {
        toast({
          title: "Error loading applications",
          description: appError.message,
          variant: "destructive",
        });
        throw appError;
      }

      // Fetch applicant profiles
      const applicantIds = appData.map(app => app.applicant_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", applicantIds);

      if (profilesError) {
        toast({
          title: "Error loading applicant profiles",
          description: profilesError.message,
          variant: "destructive",
        });
      }

      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, { id: string, first_name: string | null, last_name: string | null }>);

      // Enhance applications with similarity score
      const enhancedApplications = appData.map(app => {
        // Get job details to use for similarity calculation
        const jobDetails = app.job;
        const jobText = jobDetails ? `${jobDetails.title} ${jobDetails.description} ${jobDetails.requirements}` : '';
        
        // Use cover letter as resume text for similarity calculation
        // In a real app, you would parse the actual resume file
        const resumeText = app.cover_letter || '';
        
        // Calculate similarity score if we have both job text and resume text
        const similarityScore = (jobText && resumeText) 
          ? Math.round(calculateCosineSimilarity(jobText, resumeText) * 100) 
          : null;
        
        return {
          ...app,
          applicant: profilesMap[app.applicant_id] || null,
          similarity_score: similarityScore
        };
      });

      // Sort applications by a combined score of ATS and similarity
      return enhancedApplications.sort((a, b) => {
        const aTotal = (a.ats_score || 0) + (a.similarity_score || 0);
        const bTotal = (b.ats_score || 0) + (b.similarity_score || 0);
        return bTotal - aTotal;
      }) as JobApplication[];
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("applications")
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-applications"] });
      toast({
        title: "Application updated",
        description: "The application status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateApplicationStatus = (applicationId: string, status: 'pending' | 'reviewed' | 'rejected' | 'approved') => {
    updateApplicationMutation.mutate({ id: applicationId, status });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Employer Dashboard</h1>
        <p className="text-muted-foreground">Manage your job postings and applications.</p>
      </div>

      <DashboardStats jobs={jobs} applications={applications} />
      
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'listings' && (
        <JobListingsSection jobs={jobs} isLoading={jobsLoading} />
      )}

      {activeTab === 'applications' && (
        <ApplicationsSection 
          applications={applications}
          isLoading={applicationsLoading}
          onUpdateStatus={handleUpdateApplicationStatus}
        />
      )}
    </div>
  );
};

export default EmployerDashboard;
