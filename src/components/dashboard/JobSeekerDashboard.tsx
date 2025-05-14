
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardTabs from "./tabs/DashboardTabs";
import ProfileSection from "./profile/ProfileSection";
import JobListSection from "./jobs/JobListSection";
import ApplicationsList from "./ApplicationsList";
import { JobApplication } from "@/types/job";

interface JobSeekerDashboardProps {
  profile: any;
}

const JobSeekerDashboard = ({ profile }: JobSeekerDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'listings' | 'applications' | 'profile'>('listings');

  // Fetch job seeker's applications
  const { data: applications, isLoading: applicationsLoading } = useQuery({
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

      return data;
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

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Job Seeker Dashboard</h1>
        <p className="text-muted-foreground">Find opportunities and track your applications.</p>
      </div>
      
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'listings' && (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Available Jobs</h2>
          <JobListSection jobs={availableJobs || []} isLoading={jobsLoading} />
        </section>
      )}
      
      {activeTab === 'applications' && (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Your Applications</h2>
          <ApplicationsList 
            applications={applications || []}
            isLoading={applicationsLoading} 
          />
        </section>
      )}

      {activeTab === 'profile' && (
        <ProfileSection 
          profile={profileData}
          isLoading={profileLoading}
        />
      )}
    </div>
  );
};

export default JobSeekerDashboard;
