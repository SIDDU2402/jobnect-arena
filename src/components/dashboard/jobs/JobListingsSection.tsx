
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import JobListItem from "../JobListItem";
import JobPostingForm from "../JobPostingForm";
import JobPreviewDialog from "../JobPreviewDialog";
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
  const [previewJob, setPreviewJob] = useState<Job | undefined>(undefined);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleViewJob = (job: Job) => {
    setPreviewJob(job);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => {
            setSelectedJob(null);
            setShowPostingForm(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Post New Job
        </Button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Your Job Postings</h2>
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

      <JobPreviewDialog 
        job={previewJob} 
        isOpen={isPreviewOpen} 
        setIsOpen={setIsPreviewOpen} 
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-md bg-slate-200 h-24 w-full"></div>
          </div>
        </div>
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
              onView={() => handleViewJob(job)}
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
    </div>
  );
};

export default JobListingsSection;
