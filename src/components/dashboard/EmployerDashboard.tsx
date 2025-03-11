import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Job, JobApplication } from "@/types/job";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase, Users, BarChart, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JobPostingForm from "./JobPostingForm";
import JobListItem from "./JobListItem";
import ApplicationsList from "./ApplicationsList";

interface EmployerDashboardProps {
  profile: any;
}

const EmployerDashboard = ({ profile }: EmployerDashboardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPostingForm, setShowPostingForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
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
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          job:jobs(*),
          applicant:profiles(first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error loading applications",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // Process the data to ensure it matches our JobApplication interface
      return data.map(item => ({
        ...item,
        applicant: item.applicant ? {
          first_name: item.applicant.first_name ?? null,
          last_name: item.applicant.last_name ?? null
        } : null
      })) as JobApplication[];
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

  const handleApproveApplication = (applicationId: string) => {
    updateApplicationMutation.mutate({ id: applicationId, status: "approved" });
  };

  const handleRejectApplication = (applicationId: string) => {
    updateApplicationMutation.mutate({ id: applicationId, status: "rejected" });
  };

  const handleUpdateApplicationStatus = (applicationId: string, status: 'pending' | 'reviewed' | 'rejected' | 'approved') => {
    updateApplicationMutation.mutate({ id: applicationId, status });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Employer Dashboard</h1>
        <p className="text-muted-foreground">Manage your job postings and applications.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Active Jobs</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {jobs?.filter(job => job.status === 'active').length || 0}
          </div>
          <div className="text-xs text-muted-foreground">Total job postings</div>
        </div>

        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Applications</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {applications?.length || 0}
          </div>
          <div className="text-xs text-muted-foreground">Total applications received</div>
        </div>

        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Pending Reviews</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {applications?.filter(app => app.status === 'pending').length || 0}
          </div>
          <div className="text-xs text-muted-foreground">Applications to review</div>
        </div>

        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Approved</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {applications?.filter(app => app.status === 'approved').length || 0}
          </div>
          <div className="text-xs text-muted-foreground">Candidates approved</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'listings' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('listings')}
        >
          Job Listings
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'applications' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('applications')}
        >
          Applications
        </button>
      </div>

      {activeTab === 'listings' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your Job Postings</h2>
            <Button
              onClick={()={() => {
                setSelectedJob(null);
                setShowPostingForm(true);
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </div>

          {showPostingForm && (
            <JobPostingForm
              job={selectedJob}
              onClose={() => {
                setShowPostingForm(false);
                setSelectedJob(null);
              }}
              onSuccess={() => {
                setShowPostingForm(false);
                setSelectedJob(null);
                queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
              }}
            />
          )}

          {jobsLoading ? (
            <div className="text-center py-10">Loading job postings...</div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobListItem 
                  key={job.id} 
                  job={job} 
                  onEdit={()={() => {
                    setSelectedJob(job);
                    setShowPostingForm(true);
                  }}
                  onView={()={() => {
                    // View logic
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={()={() => setShowPostingForm(true)}
              >
                Post Your First Job
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === 'applications' && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Applications Received</h2>
          </div>

          {applicationsLoading ? (
            <div className="text-center py-10">Loading applications...</div>
          ) : applications && applications.length > 0 ? (
            <ApplicationsList 
              applications={applications} 
              onUpdateStatus={handleUpdateApplicationStatus} 
            />
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">No applications received yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployerDashboard;
