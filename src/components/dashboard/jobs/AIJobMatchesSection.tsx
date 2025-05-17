
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { AIJobAgent, JobMatch } from "@/services/AIJobAgent";
import { UserProfile, Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronUp,
  Briefcase,
  Clock,
  Zap,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AIJobMatchesSectionProps {
  profile: UserProfile | null;
  resumeUrl: string | null;
  resumeText: string;
  onRefreshApplications: () => void;
}

const AIJobMatchesSection = ({ 
  profile,
  resumeUrl,
  resumeText,
  onRefreshApplications
}: AIJobMatchesSectionProps) => {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [autoApplyingJob, setAutoApplyingJob] = useState<string | null>(null);
  
  // Query to fetch job matches
  const { 
    data: jobMatches, 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["ai-job-matches", profile?.id, resumeText],
    queryFn: async () => {
      if (!profile || !resumeText) return [];
      return AIJobAgent.findMatchingJobs(profile, resumeText);
    },
    enabled: !!profile && !!resumeText,
  });
  
  const handleAutoApply = async (jobMatch: JobMatch) => {
    if (!profile) {
      toast({
        title: "Profile not found",
        description: "Please complete your profile before applying to jobs.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setAutoApplyingJob(jobMatch.job.id);
      
      const success = await AIJobAgent.autoApplyToJob(
        jobMatch.job,
        profile,
        resumeUrl,
        resumeText
      );
      
      if (success) {
        onRefreshApplications();
      }
    } catch (error) {
      console.error("Error auto-applying to job:", error);
      toast({
        title: "Application Failed",
        description: "There was an error applying to this job.",
        variant: "destructive",
      });
    } finally {
      setAutoApplyingJob(null);
    }
  };

  const formatMatchScore = (score: number) => {
    return Math.round(score * 100);
  };
  
  return (
    <Card className="border-primary/20 shadow-lg mb-8">
      <CardHeader 
        className="cursor-pointer bg-primary-foreground/5 dark:bg-primary/5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              AI Job Matches
            </CardTitle>
            <Badge variant="outline" className="ml-2 bg-primary/10">
              {isLoading ? "..." : jobMatches?.length || 0} matches
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Our AI has analyzed your profile and found these job matches for you.
                You can auto-apply to these positions with an AI-generated cover letter.
              </p>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-md">
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                      <div className="flex justify-end mt-4">
                        <Skeleton className="h-9 w-28" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : jobMatches && jobMatches.length > 0 ? (
                <div className="space-y-4">
                  {jobMatches.map((jobMatch) => (
                    <motion.div
                      key={jobMatch.job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 border rounded-md hover:border-primary/30 hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{jobMatch.job.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {jobMatch.job.company} • {jobMatch.job.location}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium flex items-center gap-1">
                            Match Score: {formatMatchScore(jobMatch.score)}%
                          </div>
                          <Progress 
                            value={formatMatchScore(jobMatch.score)} 
                            className="h-1.5 w-24"
                          />
                        </div>
                      </div>
                      
                      <p className="text-sm mt-2 flex items-center gap-1">
                        {jobMatch.score >= 0.7 ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span>{jobMatch.matchReason}</span>
                      </p>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Posted {formatDateDistance(jobMatch.job.created_at)}
                        </div>
                        
                        <Button 
                          size="sm"
                          onClick={() => handleAutoApply(jobMatch)}
                          disabled={autoApplyingJob === jobMatch.job.id}
                        >
                          {autoApplyingJob === jobMatch.job.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3 mr-1" />
                              Auto Apply
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    No job matches found. Complete your profile and upload a resume to get started.
                  </p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-end px-6 pb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Finding matches...
                  </>
                ) : (
                  <>Refresh matches</>
                )}
              </Button>
            </CardFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Helper function to format date distances
const formatDateDistance = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
};

export default AIJobMatchesSection;
