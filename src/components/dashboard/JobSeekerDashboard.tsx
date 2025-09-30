import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AIStatus } from "./AIStatus";
import { AIInsights } from "./AIInsights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Briefcase, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Target,
  Zap,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Brain,
  Lightbulb
} from "lucide-react";
import { motion } from "framer-motion";
import { AgentOrchestrator } from "@/services/agents/AgentOrchestrator";
import { JobMatch, AIJobAgent } from "@/services/AIJobAgent";
import ApplyForm from "./ApplyForm";
import { Job } from "@/types/job";
import ApplicationsList from "@/components/dashboard/applications/ApplicationsList";
import { AIAnalyticsTab } from "./tabs/AIAnalyticsTab";

interface JobSeekerDashboardProps {
  profile: any;
}

const JobSeekerDashboard = ({ profile }: JobSeekerDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplyFormOpen, setIsApplyFormOpen] = useState(false);
  const [agentTasks, setAgentTasks] = useState<any[]>([]);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<any>({});

  const orchestrator = AgentOrchestrator.getInstance();

  const { data: myApplications, isLoading: myAppsLoading } = useQuery({
    queryKey: ['myApplications', user?.id],
    queryFn: async () => {
      if (!user) return [] as any[];
      const { data, error } = await supabase
        .from('applications')
        .select('*, job:jobs(*)')
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch agent tasks and metrics
  useEffect(() => {
    const loadAgentData = async () => {
      if (!user) return;
      
      try {
        const [tasks, metrics] = await Promise.all([
          orchestrator.getUserTasks(user.id),
          orchestrator.getSystemMetrics()
        ]);
        
        setAgentTasks(tasks);
        setAgentMetrics(metrics);
      } catch (error) {
        console.error('Error loading agent data:', error);
      }
    };

    loadAgentData();
  }, [user?.id]);

  // Fetch AI job matches
  useEffect(() => {
    const loadJobMatches = async () => {
      if (!profile || !AIJobAgent.isProfileReadyForAgent(profile, "sample resume text")) return;
      
      try {
        const matches = await AIJobAgent.findMatchingJobs(profile, "sample resume text");
        setJobMatches(matches.slice(0, 5)); // Show top 5 matches
      } catch (error) {
        console.error('Error loading job matches:', error);
      }
    };

    loadJobMatches();
  }, [profile]);

  // Schedule AI tasks
  const scheduleAgentTask = async (taskType: string) => {
    try {
      const taskId = await orchestrator.scheduleTask({
        type: taskType as any,
        priority: 'medium',
        payload: {
          userId: user?.id,
          profile,
          resumeText: "sample resume text"
        },
        userId: user?.id || ''
      });

      toast({
        title: "AI Agent Activated",
        description: `${taskType.replace('_', ' ')} analysis has been scheduled.`,
      });

      // Refresh tasks after scheduling
      const updatedTasks = await orchestrator.getUserTasks(user?.id || '');
      setAgentTasks(updatedTasks);
    } catch (error) {
      console.error('Error scheduling task:', error);
      toast({
        title: "Error",
        description: "Failed to schedule AI agent task.",
        variant: "destructive"
      });
    }
  };

  const handleJobApply = (job: Job) => {
    setSelectedJob(job);
    setIsApplyFormOpen(true);
  };

  const handleApplicationSubmit = async (
    coverLetter: string,
    resumeUrl: string | null,
    resumeText: string
  ) => {
    try {
      if (!selectedJob || !profile?.id) {
        toast({
          title: "Unable to submit",
          description: "Missing job or profile information.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("applications").insert({
        job_id: selectedJob.id,
        applicant_id: profile.id,
        cover_letter: coverLetter,
        resume_url: resumeUrl,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Application submitted",
        description: "Your application was sent successfully.",
      });

      setIsApplyFormOpen(false);
      setSelectedJob(null);
    } catch (err: any) {
      console.error("Error submitting application:", err);
      toast({
        title: "Submission failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="space-y-6">
      {/* AI Status Panel */}
      <AIStatus userProfile={profile} />
      
      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-primary/10 via-background to-secondary/10">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      Welcome back, {profile.first_name}!
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Your AI-powered career assistant is ready to help you succeed
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* AI Agent Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active AI Agents</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentMetrics.activeAgents || 6}</div>
                <p className="text-xs text-muted-foreground">Working for you 24/7</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentMetrics.completedTasks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {agentMetrics.successRate?.toFixed(1) || 0}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentMetrics.queueLength || 0}</div>
                <p className="text-xs text-muted-foreground">Pending tasks</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobs">AI Matches</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    AI-Powered Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Activate your AI career agents with one click
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => scheduleAgentTask('job_matching')}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                    variant="outline"
                  >
                    <Target className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Find Perfect Jobs</div>
                      <div className="text-sm text-muted-foreground">AI job matching</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => scheduleAgentTask('career_analysis')}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                    variant="outline"
                  >
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Career Analysis</div>
                      <div className="text-sm text-muted-foreground">Growth insights</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => scheduleAgentTask('skill_development')}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                    variant="outline"
                  >
                    <BookOpen className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Skill Development</div>
                      <div className="text-sm text-muted-foreground">Personalized learning</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => scheduleAgentTask('market_intelligence')}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                    variant="outline"
                  >
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Market Intelligence</div>
                      <div className="text-sm text-muted-foreground">Industry trends</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => scheduleAgentTask('application_optimization')}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                    variant="outline"
                  >
                    <Briefcase className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Optimize Applications</div>
                      <div className="text-sm text-muted-foreground">ATS optimization</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => scheduleAgentTask('network_discovery')}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                    variant="outline"
                  >
                    <Users className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Network Discovery</div>
                      <div className="text-sm text-muted-foreground">Professional connections</div>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              {/* Recent AI Job Matches */}
              {jobMatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>🎯 AI-Curated Job Matches</CardTitle>
                    <CardDescription>
                      Jobs perfectly matched to your profile by our AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {jobMatches.slice(0, 3).map((match, index) => (
                      <motion.div
                        key={match.job.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{match.job.title}</h4>
                            <Badge variant="secondary">{match.score}% match</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {match.job.company} • {match.job.location}
                          </p>
                          <p className="text-xs text-primary">{match.reason}</p>
                        </div>
                        <Button 
                          onClick={() => handleJobApply(match.job)}
                          size="sm"
                        >
                          Apply Now
                        </Button>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Job Recommendations</CardTitle>
                  <CardDescription>
                    Intelligently matched opportunities based on your profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jobMatches.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No matches yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Activate the Job Matching AI agent to find perfect opportunities
                      </p>
                      <Button onClick={() => scheduleAgentTask('job_matching')}>
                        Start AI Job Matching
                      </Button>
                    </div>
                  ) : (
                    jobMatches.map((match, index) => (
                      <motion.div
                        key={match.job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 border rounded-lg space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{match.job.title}</h3>
                              <Badge variant="default">{match.score}% Match</Badge>
                            </div>
                            <p className="text-muted-foreground mb-2">
                              {match.job.company} • {match.job.location} • {match.job.salary}
                            </p>
                            <p className="text-sm mb-3">{match.reason}</p>
                            <div className="mb-4">
                              <Progress value={match.score} className="h-2 mb-1" />
                              <p className="text-xs text-muted-foreground">
                                AI Compatibility Score
                              </p>
                            </div>
                          </div>
                          <Button onClick={() => handleJobApply(match.job)}>
                            Apply with AI
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {match.job.description.substring(0, 200)}...
                        </p>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
              </TabsContent>

              <TabsContent value="applications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Applications</CardTitle>
                    <CardDescription>Track applications and statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ApplicationsList applications={(myApplications as any) || []} isLoading={!!myAppsLoading} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agents" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent AI Tasks</CardTitle>
                    <CardDescription>
                      Your AI agents' recent activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {agentTasks.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No tasks yet. Activate an AI agent to get started!
                      </p>
                    ) : (
                      agentTasks.slice(0, 5).map((task, index) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 border rounded">
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in_progress' ? 'bg-blue-500' :
                            task.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium capitalize">
                              {task.type.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(task.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            task.status === 'completed' ? 'default' :
                            task.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {task.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Agent Capabilities */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Agent Capabilities</CardTitle>
                    <CardDescription>
                      What your AI assistants can do for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: Target, name: "Job Matching", desc: "Find perfect job opportunities" },
                      { icon: TrendingUp, name: "Career Analysis", desc: "Analyze career growth paths" },
                      { icon: BarChart3, name: "Market Intelligence", desc: "Track industry trends" },
                      { icon: Briefcase, name: "Application Optimization", desc: "Enhance your applications" },
                      { icon: BookOpen, name: "Skill Development", desc: "Personalized learning paths" },
                      { icon: Users, name: "Network Discovery", desc: "Build professional connections" }
                    ].map((agent, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded">
                        <agent.icon className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">{agent.desc}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AIAnalyticsTab userProfile={profile} />
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Manage your profile and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <p className="text-lg">{profile.first_name} {profile.last_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Role</label>
                      <Badge>{profile.role}</Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Skills</label>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills?.length ? (
                          profile.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="outline">{skill}</Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No skills added yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* AI Insights Sidebar */}
        <div className="lg:col-span-1">
          <AIInsights userProfile={profile} onManualApply={handleJobApply} onNavigateTab={setActiveTab} />
        </div>
      </div>

      {/* Apply Form Dialog */}
      {selectedJob && isApplyFormOpen && (
        <ApplyForm
          job={selectedJob}
          onClose={() => {
            setIsApplyFormOpen(false);
            setSelectedJob(null);
          }}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </div>
  );
};

export default JobSeekerDashboard;