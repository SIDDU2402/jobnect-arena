
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, DollarSign, Clock, Edit, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JobListItemProps {
  job: Job;
  onEdit: () => void;
  onView: () => void;
}

const JobListItem = ({ job, onEdit, onView }: JobListItemProps) => {
  const statusColors = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    closed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  const statusColor = statusColors[job.status as keyof typeof statusColors] || statusColors.active;
  
  // Format salary to show ₹ symbol if it doesn't already have it
  const formattedSalary = job.salary.includes('₹') ? job.salary : job.salary.replace('$', '₹');
  
  return (
    <div className="border border-border rounded-lg p-4 bg-background hover:bg-accent/5 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{job.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor} md:ml-2`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{formattedSalary}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{job.type}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 self-end md:self-center">
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobListItem;
