
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { AIJobAgent, JobMatch } from "@/services/AIJobAgent";
import { UserProfile, Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  Briefcase,
  Clock,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Bot
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
  const [agentActive, setAgentActive] = useState(false);
  const [agentWorking, setAgentWorking] = useState(false);
  
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

  const activateJobAgent = async () => {
    if (!profile || !resumeText) {
      toast({
        title: "Cannot activate Agent",
        description: "Please complete your profile and upload a resume first.",
        variant: "destructive"
      });
      return;
    }
    
    setAgentActive(true);
    toast({
      title: "AI Job Agent activated!",
      description: "The agent will now monitor for suitable jobs and apply automatically."
    });
    
    // Immediately run a job match scan
    await runAgentCycle();
  };
  
  const deactivateJobAgent = () => {
    setAgentActive(false);
    toast({
      title: "AI Job Agent deactivated",
      description: "The agent will no longer apply to jobs automatically."
    });
  };
  
  const runAgentCycle = async () => {
    if (!agentActive || !profile || !resumeText || agentWorking) return;
    
    try {
      setAgentWorking(true);
      
      // Refetch latest job matches
      await refetch();
      
      // Find the best match (if any) to auto-apply
      if (jobMatches && jobMatches.length > 0) {
        // Filter for only high-quality matches (above 70%)
        const bestMatches = jobMatches.filter(match => match.score >= 0.7);
        
        if (bestMatches.length > 0) {
          // Sort by score (highest first)
          bestMatches.sort((a, b) => b.score - a.score);
          
          // Take the top match and auto-apply
          const bestMatch = bestMatches[0];
          
          toast({
            title: "AI Agent Found a Match!",
            description: `Found highly suitable job: ${bestMatch.job.title} at ${bestMatch.job.company}`,
          });
          
          // Short delay to allow user to see the toast notification
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Auto-apply
          await handleAutoApply(bestMatch);
        }
      }
    } catch (error) {
      console.error("Error in agent cycle:", error);
    } finally {
      setAgentWorking(false);
    }
  };
  
  // Run agent cycle every time agent status changes
  useEffect(() => {
    if (agentActive) {
      // Initial scan
      runAgentCycle();
      
      // Set up periodic scanning (every 2 minutes)
      const intervalId = setInterval(runAgentCycle, 120000);
      
      return () => clearInterval(intervalId);
    }
  }, [agentActive, profile, resumeText]);

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
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <Bot className={`h-6 w-6 ${agentActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                  <div>
                    <h3 className="font-medium">AI Job Agent</h3>
                    <p className="text-xs text-muted-foreground">
                      {agentActive 
                        ? "Agent is active and will automatically apply to matching jobs" 
                        : "Activate the agent to automatically apply to best matching jobs"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="agent-toggle" className={agentActive ? "text-primary font-medium" : "text-muted-foreground"}>
                    {agentActive ? "Active" : "Inactive"}
                  </Label>
                  <Switch
                    id="agent-toggle"
                    checked={agentActive}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        activateJobAgent();
                      } else {
                        deactivateJobAgent();
                      }
                    }}
                    className={`${agentActive ? 'data-[state=checked]:bg-primary' : ''}`}
                  />
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Our AI has analyzed your profile and found these job matches for you.
                You can auto-apply to these positions with an AI-generated cover letter.
              </p>
              
              {agentWorking && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-primary/10 rounded-md flex items-center gap-3"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm font-medium">AI agent is scanning jobs and preparing applications...</p>
                </motion.div>
              )}
              
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
                          className="animate-in fade-in"
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
                className="transition-all duration-300 hover:bg-primary/10"
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
