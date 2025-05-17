
import { useState } from "react";
import { JobApplication } from "@/types/job";
import { formatDistanceToNow } from "date-fns";
import JobSeekerApplicationPreviewDialog from "./JobSeekerApplicationPreviewDialog";

interface ApplicationsListProps {
  applications: JobApplication[];
  isLoading: boolean;
}

const ApplicationsList = ({ applications, isLoading }: ApplicationsListProps) => {
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleViewApplication = (application: JobApplication) => {
    setSelectedApplication(application);
    setIsPreviewOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading your applications...</div>;
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-lg border-border">
        <h3 className="text-lg font-medium mb-2">No Applications Found</h3>
        <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {applications.map((application) => (
          <div 
            key={application.id}
            className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
            onClick={() => handleViewApplication(application)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg">{application.job.title}</h3>
                <p className="text-muted-foreground">{application.job.company}</p>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 text-xs rounded ${
                  application.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                  application.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {application.status === 'approved' ? 'Approved' :
                   application.status === 'rejected' ? 'Rejected' :
                   application.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                </span>
              </div>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-y-1">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Location:</span> {application.job.location}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Salary:</span> {application.job.salary}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Applied:</span> {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">ATS Score:</span> {application.ats_score || 0}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedApplication && (
        <JobSeekerApplicationPreviewDialog
          application={selectedApplication}
          isOpen={isPreviewOpen}
          setIsOpen={setIsPreviewOpen}
        />
      )}
    </>
  );
};

export default ApplicationsList;
