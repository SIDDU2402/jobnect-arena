
import { JobApplication } from "@/types/job";
import ApplicationsList from "../ApplicationsList";

interface ApplicationsSectionProps {
  applications: JobApplication[] | undefined;
  isLoading: boolean;
  onUpdateStatus: (id: string, status: 'pending' | 'reviewed' | 'rejected' | 'approved') => void;
}

const ApplicationsSection = ({ applications, isLoading, onUpdateStatus }: ApplicationsSectionProps) => {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Applications Received</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading applications...</div>
      ) : applications && applications.length > 0 ? (
        <ApplicationsList 
          applications={applications} 
          onUpdateStatus={onUpdateStatus} 
        />
      ) : (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No applications received yet.</p>
        </div>
      )}
    </>
  );
};

export default ApplicationsSection;
