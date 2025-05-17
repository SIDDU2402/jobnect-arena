
import { Job } from "@/types/job";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/JobCard";
import { motion } from "framer-motion";

interface JobListSectionProps {
  jobs: Job[];
  isLoading: boolean;
  onApplyClick?: (job: Job) => void;
}

const JobListSection = ({ jobs, isLoading, onApplyClick }: JobListSectionProps) => {
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const emptyStateVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div>
      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <JobCard 
                id={job.id}
                title={job.title}
                company={job.company}
                location={job.location}
                salary={job.salary}
                type={job.type}
                postedAt={job.created_at}
                logo={job.logo || undefined}
                featured={job.featured || false}
                onApply={onApplyClick ? () => onApplyClick(job) : undefined}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="text-center py-10 border border-dashed rounded-lg border-border"
          variants={emptyStateVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="text-lg font-medium mb-2">No Jobs Found</h3>
          <p className="text-muted-foreground mb-6">There are currently no jobs available.</p>
          <Button asChild>
            <Link to="/jobs">
              <PlusCircle className="h-4 w-4 mr-2" />
              Browse All Jobs
            </Link>
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default JobListSection;
