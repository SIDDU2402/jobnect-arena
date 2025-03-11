
import { JobApplication } from "@/types/job";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, Briefcase, CheckCircle, XCircle, BarChart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ApplicationsListProps {
  applications: JobApplication[];
  onUpdateStatus: (id: string, status: 'pending' | 'reviewed' | 'rejected' | 'approved') => void;
}

const ApplicationsList = ({ applications, onUpdateStatus }: ApplicationsListProps) => {
  const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    reviewed: "bg-blue-100 text-blue-800",
    rejected: "bg-red-100 text-red-800",
    approved: "bg-green-100 text-green-800",
  };
  
  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <div key={application.id} className="border border-border rounded-lg p-4 bg-background">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {application.applicant?.first_name || 'Unnamed'} {application.applicant?.last_name || 'Applicant'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[application.status as keyof typeof statusColors] || statusColors.pending}`}>
                    {application.status ? (application.status.charAt(0).toUpperCase() + application.status.slice(1)) : 'Pending'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Applied for {application.job?.title || 'Unnamed Position'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 px-3 py-1 rounded flex items-center gap-1">
                  <BarChart className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">ATS Score: {application.ats_score || 0}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
            
            <div className="border-t border-border pt-4 flex flex-wrap gap-2">
              {application.status === 'pending' && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onUpdateStatus(application.id, 'reviewed')}
                  >
                    Mark as Reviewed
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => onUpdateStatus(application.id, 'approved')}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => onUpdateStatus(application.id, 'rejected')}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              
              {application.status === 'reviewed' && (
                <>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => onUpdateStatus(application.id, 'approved')}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => onUpdateStatus(application.id, 'rejected')}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              
              {(application.status === 'approved' || application.status === 'rejected') && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdateStatus(application.id, 'reviewed')}
                >
                  Reset to Reviewed
                </Button>
              )}
              
              <Button size="sm" variant="outline">
                View Resume
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApplicationsList;
