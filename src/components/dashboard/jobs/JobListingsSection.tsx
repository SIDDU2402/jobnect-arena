
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import JobListItem from "../JobListItem";
import JobPostingForm from "../JobPostingForm";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface JobListingsSectionProps {
  jobs: Job[] | undefined;
  isLoading: boolean;
}

const JobListingsSection = ({ jobs, isLoading }: JobListingsSectionProps) => {
  const [showPostingForm, setShowPostingForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleViewJob = (jobId: string) => {
    toast({
      title: "View Job",
      description: `Viewing job with ID: ${jobId}`,
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Job Postings</h2>
        <Button
          onClick={() => {
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
            toast({
              title: selectedJob ? "Job Updated" : "Job Posted",
              description: selectedJob 
                ? "Your job has been updated successfully." 
                : "Your job has been posted successfully.",
            });
          }}
        />
      )}

      {isLoading ? (
        <div className="text-center py-10">Loading job postings...</div>
      ) : jobs && jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobListItem 
              key={job.id} 
              job={job} 
              onEdit={() => {
                setSelectedJob(job);
                setShowPostingForm(true);
              }}
              onView={() => handleViewJob(job.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowPostingForm(true)}
          >
            Post Your First Job
          </Button>
        </div>
      )}
    </>
  );
};

export default JobListingsSection;
