
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import JobCard from "@/components/JobCard";

interface JobListSectionProps {
  jobs: any[];
  isLoading: boolean;
}

const JobListSection = ({ jobs, isLoading }: JobListSectionProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="p-4 border border-border rounded-lg">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed rounded-lg border-border">
          <h3 className="text-lg font-medium mb-2">No Jobs Found</h3>
          <p className="text-muted-foreground mb-6">There are currently no jobs available.</p>
          <Button asChild>
            <Link to="/jobs">
              <PlusCircle className="h-4 w-4 mr-2" />
              Browse All Jobs
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobListSection;
