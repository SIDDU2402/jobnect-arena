
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronUp,
  Briefcase,
  Clock,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Bot,
  Trophy,
  BarChart3,
  FileSpreadsheet,
  Lightbulb,
  Settings,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [activeTab, setActiveTab] = useState<string>("matches");
  const [agentLevel, setAgentLevel] = useState<number>(1);
  const [agentExperience, setAgentExperience] = useState<number>(0);
  
  // Check if profile is ready for AI Agent operations
  const isProfileReadyForAgent = profile && resumeText 
    ? AIJobAgent.isProfileReadyForAgent(profile, resumeText) 
    : false;
  
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
  
  // Query to fetch agent statistics
  const {
    data: agentStats,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useQuery({
    queryKey: ["agent-stats", profile?.id],
    queryFn: async () => {
      if (!profile) return null;
      return AIJobAgent.getAgentStats(profile.id);
    },
    enabled: !!profile?.id && agentActive,
  });
  
  // Query to fetch job market trends
  const {
    data: marketTrends,
    isLoading: trendsLoading,
    refetch: refetchTrends
  } = useQuery({
    queryKey: ["job-market-trends"],
    queryFn: async () => {
      return AIJobAgent.analyzeJobMarketTrends();
    },
    enabled: activeTab === "insights",
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
        // Increase agent experience points when successfully applying
        setAgentExperience(prev => {
          const newExp = prev + 25;
          // Level up if experience reaches 100
          if (newExp >= 100) {
            setAgentLevel(prevLevel => prevLevel + 1);
            toast({
              title: "Agent Leveled Up!",
              description: `Your AI Job Agent has reached level ${agentLevel + 1}!`,
            });
            return newExp - 100; // Reset experience with remainder
          }
          return newExp;
        });
        
        toast({
          title: "Application Submitted",
          description: `Successfully applied to ${jobMatch.job.title} at ${jobMatch.job.company}!`,
        });
        
        // Refresh applications list and agent statistics
        onRefreshApplications();
        refetchStats();
      } else {
        toast({
          title: "Already Applied",
          description: "You've already applied to this job.",
        });
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
    if (!isProfileReadyForAgent) {
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
    
    // Store agent state in session storage to persist across refreshes
    sessionStorage.setItem('aiJobAgentActive', 'true');
    sessionStorage.setItem('aiJobAgentLevel', agentLevel.toString());
    sessionStorage.setItem('aiJobAgentExp', agentExperience.toString());
    
    // Immediately run a job match scan
    await runAgentCycle();
  };
  
  const deactivateJobAgent = () => {
    setAgentActive(false);
    toast({
      title: "AI Job Agent deactivated",
      description: "The agent will no longer apply to jobs automatically."
    });
    
    // Remove agent state from session storage
    sessionStorage.removeItem('aiJobAgentActive');
  };
  
  // Restore agent state from session storage on component mount
  useEffect(() => {
    const storedAgentState = sessionStorage.getItem('aiJobAgentActive');
    const storedAgentLevel = sessionStorage.getItem('aiJobAgentLevel');
    const storedAgentExp = sessionStorage.getItem('aiJobAgentExp');
    
    if (storedAgentLevel) {
      setAgentLevel(parseInt(storedAgentLevel));
    }
    
    if (storedAgentExp) {
      setAgentExperience(parseInt(storedAgentExp));
    }
    
    if (storedAgentState === 'true' && isProfileReadyForAgent) {
      setAgentActive(true);
    }
  }, [isProfileReadyForAgent]);
  
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
          
          // Increase agent experience
          setAgentExperience(prev => {
            const newExp = prev + 10;
            // Level up if experience reaches 100
            if (newExp >= 100) {
              setAgentLevel(prevLevel => prevLevel + 1);
              toast({
                title: "Agent Leveled Up!",
                description: `Your AI Job Agent has reached level ${agentLevel + 1}!`,
              });
              return newExp - 100; // Reset experience with remainder
            }
            return newExp;
          });
          
          // Store updated agent level and experience
          sessionStorage.setItem('aiJobAgentLevel', agentLevel.toString());
          sessionStorage.setItem('aiJobAgentExp', agentExperience.toString());
        }
      }
    } catch (error) {
      console.error("Error in agent cycle:", error);
    } finally {
      setAgentWorking(false);
    }
  };
  
  // Run agent cycle when agent is activated
  useEffect(() => {
    if (agentActive && isProfileReadyForAgent) {
      // Initial scan
      runAgentCycle();
      
      // Set up periodic scanning (every 2 minutes)
      const intervalId = setInterval(runAgentCycle, 120000);
      
      return () => clearInterval(intervalId);
    }
  }, [agentActive, isProfileReadyForAgent]);

  const formatMatchScore = (score: number) => {
    return Math.round(score * 100);
  };
  
  // Show agent level features and abilities
  const getAgentAbilities = (level: number) => {
    const abilities = [
      { level: 1, name: "Job Matching", description: "Basic job matching based on your skills and resume" },
      { level: 2, name: "Personalized Cover Letters", description: "Creates cover letters tailored to specific job requirements" },
      { level: 3, name: "Market Insights", description: "Provides job market trends and in-demand skills" },
      { level: 4, name: "Application Optimization", description: "Learns from successful applications to improve future applications" },
      { level: 5, name: "Career Path Analysis", description: "Suggests logical next steps in your career progression" }
    ];
    
    return abilities.filter(ability => ability.level <= level);
  };
  
  // Calculate next level threshold
  const nextLevelThreshold = 100;
  
  // Get appropriate agent title based on level
  const getAgentTitle = (level: number) => {
    const titles = [
      "Novice Assistant",
      "Job Finder",
      "Career Advisor",
      "Employment Specialist",
      "Career Strategist"
    ];
    
    return level <= titles.length ? titles[level - 1] : "Job Search Master";
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
              AI Job Agent
            </CardTitle>
            <Badge variant="outline" className="ml-2 bg-primary/10">
              Level {agentLevel} {getAgentTitle(agentLevel)}
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
              {/* Agent Status and Control Panel */}
              <div className="flex justify-between items-center mb-6 py-3 px-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bot className={`h-6 w-6 ${agentActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                    {agentActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">AI Job Agent</h3>
                      <Badge 
                        variant={agentActive ? "default" : "outline"}
                        className={agentActive ? "bg-green-500/90 hover:bg-green-500" : ""}
                      >
                        {agentActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {agentActive 
                        ? "Monitoring job market and applying to best matches" 
                        : "Activate to automatically apply to matching jobs"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-medium mb-1">Level {agentLevel}</div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        style={{ width: `${(agentExperience / nextLevelThreshold) * 100}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(agentExperience / nextLevelThreshold) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {agentExperience}/{nextLevelThreshold} XP
                    </div>
                  </div>
                  
                  <Switch
                    id="agent-toggle"
                    checked={agentActive}
                    disabled={!isProfileReadyForAgent}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        activateJobAgent();
                      } else {
                        deactivateJobAgent();
                      }
                    }}
                    className={agentActive ? "data-[state=checked]:bg-primary" : ""}
                  />
                </div>
              </div>
              
              {!isProfileReadyForAgent && (
                <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <AlertTitle className="text-amber-800 dark:text-amber-500 text-sm font-medium">Profile needs improvement</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
                    Complete your profile with professional summary, skills (at least 3), and resume to enable the AI Job Agent.
                  </AlertDescription>
                </Alert>
              )}
              
              {agentActive && agentLevel >= 3 && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="matches" className="text-xs sm:text-sm">
                      <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                      Job Matches
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="text-xs sm:text-sm">
                      <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                      Agent Stats
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="text-xs sm:text-sm">
                      <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                      Market Insights
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              
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
              
              <TabsContent value="matches" className="mt-0 p-0">
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
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-end">
                                  <div className="text-sm font-medium flex items-center gap-1">
                                    Match Score: {formatMatchScore(jobMatch.score)}%
                                  </div>
                                  <Progress 
                                    value={formatMatchScore(jobMatch.score)} 
                                    className="h-1.5 w-24"
                                    // Change color based on score
                                    style={{
                                      background: jobMatch.score >= 0.7 ? 'var(--green-200)' : 'var(--amber-200)',
                                    }}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                Score breakdown:
                                <br />• Resume match: {formatMatchScore(jobMatch.score * 0.6)}%
                                <br />• Skill alignment: {formatMatchScore(jobMatch.score * 0.3)}%
                                <br />• Career fit: {formatMatchScore(jobMatch.score * 0.1)}%
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                            disabled={autoApplyingJob === jobMatch.job.id || !isProfileReadyForAgent}
                            className="animate-in fade-in gap-1"
                            variant={jobMatch.score >= 0.7 ? "default" : "secondary"}
                          >
                            {autoApplyingJob === jobMatch.job.id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              <>
                                <Zap className="h-3 w-3" />
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
                      {!resumeText 
                        ? "Upload a resume to get job matches."
                        : "No job matches found. Complete your profile to improve matches."}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="stats" className="mt-0 p-0">
                {statsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : agentStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="p-4 flex flex-col items-center justify-center">
                        <p className="text-xs text-muted-foreground mb-1">Auto Applications</p>
                        <p className="text-2xl font-bold">{agentStats.totalAutoApplications || 0}</p>
                      </Card>
                      <Card className="p-4 flex flex-col items-center justify-center">
                        <p className="text-xs text-muted-foreground mb-1">Successful</p>
                        <p className="text-2xl font-bold text-green-500">
                          {agentStats.successfulApplications || 0}
                        </p>
                      </Card>
                      <Card className="p-4 flex flex-col items-center justify-center">
                        <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                        <p className="text-2xl font-bold">
                          {agentStats.successRate ? Math.round(agentStats.successRate) : 0}%
                        </p>
                      </Card>
                    </div>
                    
                    <Card className="p-4">
                      <h4 className="text-sm font-medium mb-3">Monthly Applications</h4>
                      <div className="h-32 flex items-end gap-1">
                        {Object.entries(agentStats.applicationsByMonth || {}).map(([month, count], i) => (
                          <div key={month} className="flex flex-col items-center flex-1">
                            <div 
                              className="w-full bg-primary/70 rounded-t"
                              style={{ height: `${Math.min((count as number / 10) * 100, 100)}%` }}
                            ></div>
                            <p className="text-xs mt-1">{formatMonth(month)}</p>
                          </div>
                        ))}
                        {Object.keys(agentStats.applicationsByMonth || {}).length === 0 && (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-muted-foreground text-sm">No application data yet</p>
                          </div>
                        )}
                      </div>
                    </Card>
                    
                    {agentLevel >= 4 && (
                      <Alert className="bg-primary/5 border-primary/20">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-sm font-medium">Agent Insights</AlertTitle>
                        <AlertDescription className="text-xs text-muted-foreground">
                          Based on your application history, you're most successful with 
                          {agentStats.successRate > 50 
                            ? " jobs that closely match your current skills. Consider focusing on roles that highlight your strengths."
                            : " jobs that require varied skills. Consider applying to diverse positions to increase your success rate."}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No agent statistics available yet.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchStats()}
                      className="mt-2"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Refresh Stats
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="insights" className="mt-0 p-0">
                {trendsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-28 w-full" />
                  </div>
                ) : marketTrends && !marketTrends.error ? (
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h4 className="text-sm font-medium mb-3">Top In-Demand Skills</h4>
                      <div className="space-y-2">
                        {(marketTrends.topSkills || []).map((skill: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <p className="text-sm">{skill.skill}</p>
                            <div className="flex items-center gap-2">
                              <div className="w-36 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary"
                                  style={{ width: `${skill.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs w-8 text-right">{skill.percentage}%</span>
                            </div>
                          </div>
                        ))}
                        
                        {(marketTrends.topSkills || []).length === 0 && (
                          <p className="text-muted-foreground text-sm text-center py-4">
                            No skill trend data available
                          </p>
                        )}
                      </div>
                    </Card>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h4 className="text-sm font-medium mb-3">Top Locations</h4>
                        <div className="space-y-2">
                          {(marketTrends.topLocations || []).map((loc: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                              <p className="text-xs">{loc.location}</p>
                              <Badge variant="outline" className="text-xs">
                                {loc.count} {loc.count === 1 ? 'job' : 'jobs'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="text-sm font-medium mb-3">Job Types</h4>
                        <div className="space-y-2">
                          {(marketTrends.jobTypes || []).map((type: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                              <p className="text-xs">{type.type}</p>
                              <Badge variant="outline" className="text-xs">
                                {type.count} {type.count === 1 ? 'job' : 'jobs'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                    
                    {agentLevel >= 5 && (
                      <Alert className="bg-primary/5 border-primary/20">
                        <Trophy className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-sm font-medium">Career Growth Recommendation</AlertTitle>
                        <AlertDescription className="text-xs text-muted-foreground">
                          Based on market trends, focusing on {(marketTrends.topSkills || [])[0]?.skill || "in-demand skills"} 
                          could increase your job prospects by up to 30%. Consider adding these skills to your profile.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      {marketTrends?.error || "No market insights available yet."}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchTrends()}
                      className="mt-2"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Analyze Market
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* Agent Settings section */}
              {agentLevel >= 3 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 pt-4 border-t"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium">Agent Capabilities</h3>
                    </div>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center">
                          <Badge variant="outline" className="cursor-help">
                            Level {agentLevel} • {getAgentTitle(agentLevel)}
                          </Badge>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">AI Agent Progression</h4>
                          <p className="text-xs text-muted-foreground">
                            Your AI agent gains experience and unlocks new capabilities as you use it.
                            Apply to jobs and interact with the agent to level it up!
                          </p>
                          <div className="pt-2">
                            <h5 className="text-xs font-medium mb-1">Agent Abilities:</h5>
                            <ul className="text-xs space-y-1">
                              {getAgentAbilities(agentLevel).map((ability, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Check className="h-3 w-3 text-green-500 mt-0.5" />
                                  <div>
                                    <span className="font-medium">{ability.name}:</span> {ability.description}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {getAgentAbilities(agentLevel).map((ability, i) => (
                      <Badge key={i} variant="secondary" className="justify-start gap-1.5">
                        <Check className="h-3 w-3 text-green-500" />
                        {ability.name}
                      </Badge>
                    ))}
                    
                    {/* Show locked abilities */}
                    {agentLevel < 5 && (
                      <Badge variant="outline" className="justify-start gap-1.5 text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Unlocks at level {agentLevel + 1}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between px-6 pb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading || !resumeText}
                className="transition-all duration-300 hover:bg-primary/10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Finding matches...
                  </>
                ) : (
                  <><RefreshCw className="h-3 w-3 mr-1.5" />Refresh matches</>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground">
                {jobMatches ? `${jobMatches.length} matches found` : "No matches yet"}
              </div>
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

// Helper function to format month from YYYY-MM
const formatMonth = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
};

// Simple Lock icon component
const Lock = ({ className }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
};

export default AIJobMatchesSection;
