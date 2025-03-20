
import { Job } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, MapPin, DollarSign, Clock, Building } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JobPreviewDialogProps {
  job: Job | undefined;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const JobPreviewDialog = ({ job, isOpen, setIsOpen }: JobPreviewDialogProps) => {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{job.title}</DialogTitle>
          <DialogDescription className="flex items-center text-foreground font-medium mt-1">
            <Building className="h-4 w-4 mr-1" /> {job.company}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {job.salary}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {job.type}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </Badge>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Job Description</h3>
            <div className="text-muted-foreground whitespace-pre-line">{job.description}</div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Requirements</h3>
            <div className="text-muted-foreground whitespace-pre-line">{job.requirements}</div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobPreviewDialog;
