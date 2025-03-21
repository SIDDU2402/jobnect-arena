import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Job, JobApplication } from "@/types/job";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Briefcase, BarChart, 
  User, Clock, Info, CheckCircle, XCircle 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { JobCard } from "@/components/JobCard";
import ApplyForm from "./ApplyForm";
import { Card } from "@/components/ui/card";
import JobSeekerApplicationPreviewDialog from "./JobSeekerApplicationPreviewDialog";
import DashboardTabs from "./tabs/DashboardTabs";

interface JobSeekerDashboardProps {
  profile: any;
}

const JobSeekerDashboard = ({ profile }: JobSeekerDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'listings' | 'applications'>('listings');
  const [applyingToJob, setApplyingToJob] = useState<Job | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'recommended'>('all');
  const [previewApplication, setPreviewApplication] = useState<JobApplication | undefined>(undefined);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Query for available jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
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

  // Query for user applications
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["user-applications"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          job:jobs(*)
        `)
        .eq("applicant_id", user.id)
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
    enabled: !!user,
  });

  // Filter out jobs that the user has already applied to
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (jobs && applications) {
      const appliedJobIds = applications.map(app => app.job_id);
      const filtered = jobs.filter(job => !appliedJobIds.includes(job.id));
      setAvailableJobs(filtered);
      
      // Simple recommendation algorithm based on job title (in real app, this would be more sophisticated)
      const recommended = filtered.filter(job => 
        job.title.toLowerCase().includes("developer") || 
        job.title.toLowerCase().includes("engineer")
      );
      setRecommendedJobs(recommended);
    }
  }, [jobs, applications]);

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async ({ 
      jobId, 
      coverLetter, 
      resumeUrl,
      resumeText 
    }: { 
      jobId: string; 
      coverLetter: string; 
      resumeUrl: string | null;
      resumeText: string;
    }) => {
      if (!user) throw new Error("User not authenticated");
      
      // Calculate ATS score (in a real app, this would be done by an actual ATS system)
      // Using a simplified mock score calculation based on matching keywords
      const atsScore = calculateMockATSScore(resumeText, jobId, jobs); 
      
      const { data, error } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          cover_letter: coverLetter,
          resume_url: resumeUrl,
          ats_score: atsScore,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-applications"] });
      queryClient.invalidateQueries({ queryKey: ["available-jobs"] });
      toast({
        title: "Application submitted",
        description: "Your job application has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate a mock ATS score based on resume text and job requirements
  const calculateMockATSScore = (resumeText: string, jobId: string, availableJobs: Job[] | undefined): number => {
    if (!availableJobs) return 70; // Default score if jobs data isn't available
    
    const job = availableJobs.find(j => j.id === jobId);
    if (!job) return 70; // Default score if job isn't found
    
    // In a real app, this would be a sophisticated algorithm
    // For this demo, we'll do a simple keyword matching
    const jobKeywords = `${job.title} ${job.description} ${job.requirements}`.toLowerCase().split(/\W+/);
    const resumeKeywords = resumeText.toLowerCase().split(/\W+/);
    
    // Count matching keywords
    const uniqueJobKeywords = [...new Set(jobKeywords)].filter(word => word.length > 3);
    const matchCount = uniqueJobKeywords.filter(word => resumeKeywords.includes(word)).length;
    
    // Calculate percentage match (with a minimum of 60 and maximum of 98)
    const rawScore = (matchCount / uniqueJobKeywords.length) * 100;
    return Math.min(98, Math.max(60, Math.round(rawScore)));
  };

  const handleApply = (job: Job) => {
    setApplyingToJob(job);
  };

  const handleSubmitApplication = (coverLetter: string, resumeUrl: string | null, resumeText: string) => {
    if (!applyingToJob) return;
    
    createApplicationMutation.mutate({
      jobId: applyingToJob.id,
      coverLetter,
      resumeUrl,
      resumeText
    });
    
    setApplyingToJob(null);
  };

  const handleViewJobDetails = (application: JobApplication) => {
    setPreviewApplication(application);
    setIsPreviewOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'reviewed':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Dialog */}
      <JobSeekerApplicationPreviewDialog
        application={previewApplication}
        isOpen={isPreviewOpen}
        setIsOpen={setIsPreviewOpen}
      />

      {/* Welcome message */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Welcome, {profile.first_name || "Job Seeker"}</h1>
        <p className="text-muted-foreground">Find your next career opportunity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Applications</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold">{applications?.length || 0}</div>
          <div className="text-xs text-muted-foreground">Total applications</div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Available Jobs</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold">{availableJobs?.length || 0}</div>
          <div className="text-xs text-muted-foreground">New opportunities</div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Avg. ATS Score</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {applications && applications.length > 0
              ? Math.round(
                  applications.reduce((sum, app) => sum + (app.ats_score || 0), 0) / applications.length
                )
              : "-"}%
          </div>
          <div className="text-xs text-muted-foreground">Resume performance</div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Profile Views</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold">24</div>
          <div className="text-xs text-muted-foreground">Last 30 days</div>
        </Card>
      </div>

      {/* Tabs */}
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'listings' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {viewMode === 'recommended' ? 'Recommended Jobs' : 'Available Jobs'}
            </h2>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                All Jobs
              </Button>
              <Button
                variant={viewMode === 'recommended' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('recommended')}
              >
                Recommended
              </Button>
            </div>
          </div>

          {applyingToJob && (
            <ApplyForm
              job={applyingToJob}
              onClose={() => setApplyingToJob(null)}
              onSubmit={handleSubmitApplication}
            />
          )}
          
          {jobsLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((item) => (
                <Card key={item} className="p-4">
                  <div className="animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="flex justify-end">
                      <div className="h-8 bg-slate-200 rounded w-24"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (viewMode === 'all' ? availableJobs : recommendedJobs).length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {(viewMode === 'all' ? availableJobs : recommendedJobs).map((job) => (
                <JobCard 
                  key={job.id} 
                  id={job.id}
                  title={job.title}
                  company={job.company}
                  location={job.location}
                  salary={job.salary}
                  type={job.type}
                  postedAt={formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  featured={false}
                  onApply={() => handleApply(job)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">
                {viewMode === 'recommended' 
                  ? "No recommended jobs found based on your profile. Try viewing all jobs."
                  : "No available jobs found at the moment."}
              </p>
              {viewMode === 'recommended' && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setViewMode('all')}
                >
                  View All Jobs
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'applications' && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">My Applications</h2>
          </div>

          {applicationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <Card key={item} className="p-4">
                  <div className="animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="flex justify-end">
                      <div className="h-8 bg-slate-200 rounded w-24"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : applications && applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{application.job?.title}</h3>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                          {getStatusIcon(application.status)}
                          <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <div>{application.job?.company} • {application.job?.location}</div>
                        <div className="mt-1">Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="bg-secondary px-3 py-1 rounded flex items-center justify-center gap-1 text-sm">
                        <BarChart className="h-3.5 w-3.5" />
                        <span className="font-medium">ATS Score: {application.ats_score || 0}%</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewJobDetails(application)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setActiveTab('listings')}
              >
                Browse Available Jobs
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobSeekerDashboard;
