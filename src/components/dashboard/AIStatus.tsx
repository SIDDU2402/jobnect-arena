import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Zap, Activity, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AIStatusProps {
  userProfile: any;
}

export function AIStatus({ userProfile }: AIStatusProps) {
  const [aiStatus, setAiStatus] = useState<'idle' | 'processing' | 'ready'>('idle');
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAIStatus();
    const interval = setInterval(checkAIStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkAIStatus = async () => {
    try {
      // Test Lovable AI connection
      const { data } = await supabase.functions.invoke('ai-career-advisor', {
        body: {
          prompt: 'Test connection',
          context: 'Health check',
          agentType: 'general',
          userProfile: { test: true }
        }
      });
      
      if (data?.analysis || data?.success !== false) {
        setAiStatus('ready');
        setLastUpdate(new Date());
      } else {
        setAiStatus('idle');
      }
    } catch (error) {
      console.error('AI status check failed:', error);
      setAiStatus('idle');
    }
  };

  const activateAIAgent = async (agentType: string) => {
    setActiveAgents(prev => [...prev, agentType]);
    
    try {
      if (agentType === 'jobMatching') {
        await handleJobMatchingAgent();
      } else {
        await handleGeneralAgent(agentType);
      }
    } catch (error) {
      console.error(`Failed to activate ${agentType} agent:`, error);
      toast({
        title: "Agent Activation Failed",
        description: `Failed to activate ${agentType} agent. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setActiveAgents(prev => prev.filter(a => a !== agentType));
    }
  };

  const handleJobMatchingAgent = async () => {
    if (!userProfile) {
      toast({ title: 'Profile Required', description: 'Complete your profile first', variant: 'destructive' });
      return;
    }

    // Get resume text first
    let resumeText = '';
    try {
      if (userProfile.resume_url) {
        const { data: resumeData } = await supabase.functions.invoke('extract-resume-text', {
          body: { resumeUrl: userProfile.resume_url }
        });
        resumeText = resumeData?.text || '';
      }
    } catch (e) {
      console.error('Failed to extract resume text', e);
    }

    // Use Lovable AI for intelligent job matching
    const { data, error } = await supabase.functions.invoke('ai-job-matching', {
      body: {
        userProfile,
        resumeText,
        analysisType: 'comprehensive'
      }
    });

    if (error) throw error;

    if (data?.matches && data.matches.length > 0) {
      // Sort by score and confidence, take top 3
      const topMatches = data.matches
        .sort((a: any, b: any) => {
          if (b.score !== a.score) return b.score - a.score;
          return (b.confidence || 0) - (a.confidence || 0);
        })
        .slice(0, 3);
      let successfulApplications = 0;
      const applicationDetails: any[] = [];

      for (const match of topMatches) {
        try {
          // Generate enhanced cover letter highlighting matched skills
          const { data: coverData } = await supabase.functions.invoke('generate-cover-letter', {
            body: {
              jobDescription: `${match.job.description}\n\nRequirements:\n${match.job.requirements}`,
              userProfile,
              resumeText,
              jobTitle: match.job.title,
              company: match.job.company,
              enhanced: true
            }
          });

          // Submit application with enhanced metadata
          const { error: appError } = await supabase.from('applications').insert({
            job_id: match.job.id,
            applicant_id: userProfile.id,
            cover_letter: coverData?.coverLetter || `Dear Hiring Manager,\n\nI am excited to apply for the ${match.job.title} position. My skills align well with your requirements.\n\nBest regards,\n${userProfile.first_name}`,
            resume_url: userProfile.resume_url,
            status: 'pending',
            auto_applied: true,
            ats_score: Math.round(match.skillsMatch || match.score),
            application_metadata: {
              ai_match_score: match.score,
              skills_match: match.skillsMatch,
              experience_match: match.experienceMatch,
              matched_skills: match.matchedSkills || [],
              confidence: match.confidence,
              applied_at: new Date().toISOString()
            }
          });

          if (!appError) {
            successfulApplications++;
            applicationDetails.push({
              company: match.job.company,
              title: match.job.title,
              score: match.score,
              confidence: match.confidence
            });
          }
        } catch (e) {
          console.error('Failed to auto-apply:', e);
        }
      }

      // Store comprehensive results
      const agentData = {
        type: 'jobMatching',
        result: {
          totalMatches: data.matches.length,
          autoApplications: successfulApplications,
          applications: applicationDetails,
          averageScore: Math.round(data.matches.reduce((sum: number, m: any) => sum + m.score, 0) / data.matches.length),
          topSkills: data.analytics?.topSkillsInDemand || [],
          competitiveness: data.analytics?.competitivenessRating || 'Unknown',
          analytics: data.analytics,
          recommendations: data.recommendations
        },
        timestamp: new Date().toISOString(),
        userId: userProfile.id
      };

      const existing = JSON.parse(localStorage.getItem('ai_agent_results') || '[]');
      existing.unshift(agentData);
      localStorage.setItem('ai_agent_results', JSON.stringify(existing.slice(0, 50)));

      // Show detailed results
      const topApp = applicationDetails[0];
      toast({
        title: "🎯 Advanced Job Matching Complete!",
        description: successfulApplications > 0 
          ? `Applied to ${successfulApplications} positions! Top: ${topApp?.company} (${topApp?.score}% fit, ${topApp?.confidence}% confidence)`
          : `Found ${data.matches.length} quality matches. Review in AI Matches tab.`,
        duration: 6000
      });
    } else {
      toast({
        title: "No Matches Found",
        description: "Update your profile and skills for better matches",
        variant: "destructive"
      });
    }
  };

  const handleGeneralAgent = async (agentType: string) => {
    let prompt = '';
    let context = '';

    switch (agentType) {
      case 'careerAnalysis':
        prompt = 'Provide comprehensive career analysis and growth recommendations based on current market trends';
        context = `User profile: ${JSON.stringify(userProfile)}, Skills: ${userProfile?.skills?.join(', ') || 'No skills listed'}`;
        break;
      case 'marketIntelligence':
        prompt = 'Analyze current job market trends, salary ranges, and high-demand skills';
        context = 'Real-time market intelligence analysis for career planning';
        break;
      case 'skillDevelopment':
        prompt = 'Recommend skill development paths and learning resources based on market demands';
        context = `Current skills: ${userProfile?.skills?.join(', ') || 'No skills listed'}`;
        break;
      case 'networkDiscovery':
        prompt = 'Analyze professional networking opportunities and strategies';
        context = 'Professional network analysis and growth recommendations';
        break;
      case 'applicationOptimization':
        prompt = 'Optimize job application strategy, resume, and interview preparation';
        context = 'Application optimization and success prediction analysis';
        break;
      default:
        prompt = 'General AI assistance for career development';
    }

    const { data } = await supabase.functions.invoke('ai-career-advisor', {
      body: {
        prompt,
        context,
        agentType,
        userProfile
      }
    });

    if (data?.analysis) {
      toast({
        title: "AI Analysis Complete",
        description: `${agentType} insights generated successfully`,
      });
      
      const agentData = {
        type: agentType,
        result: data.analysis,
        timestamp: new Date().toISOString(),
        userId: userProfile?.id
      };
      
      const existing = JSON.parse(localStorage.getItem('ai_agent_results') || '[]');
      existing.unshift(agentData);
      localStorage.setItem('ai_agent_results', JSON.stringify(existing.slice(0, 50)));
    }
  };

  const agents = [
    {
      id: 'jobMatching',
      name: 'Job Matching',
      description: 'Real-time job opportunity analysis',
      icon: Brain,
      color: 'bg-blue-500'
    },
    {
      id: 'careerAnalysis',
      name: 'Career Analysis',
      description: 'AI-powered career path insights',
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      id: 'marketIntelligence',
      name: 'Market Intelligence',
      description: 'Live market trends and salary data',
      icon: Zap,
      color: 'bg-purple-500'
    },
    {
      id: 'skillDevelopment',
      name: 'Skill Development',
      description: 'Personalized learning recommendations',
      icon: CheckCircle,
      color: 'bg-orange-500'
    },
    {
      id: 'networkDiscovery',
      name: 'Network Discovery',
      description: 'Professional networking insights',
      icon: Activity,
      color: 'bg-pink-500'
    },
    {
      id: 'applicationOptimization',
      name: 'Application Optimizer',
      description: 'Resume and cover letter enhancement',
      icon: Clock,
      color: 'bg-indigo-500'
    }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Agent Control Center
          <Badge variant={aiStatus === 'ready' ? 'default' : 'secondary'}>
            {aiStatus === 'ready' ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
        {lastUpdate && (
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const isActive = activeAgents.includes(agent.id);
            
            return (
              <div
                key={agent.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${agent.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {agent.description}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => activateAIAgent(agent.id)}
                      disabled={isActive || aiStatus !== 'ready'}
                      className="w-full"
                    >
                      {isActive ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        'Activate Agent'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {aiStatus !== 'ready' && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              AI agents are currently offline. Please check your Lovable AI configuration.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}