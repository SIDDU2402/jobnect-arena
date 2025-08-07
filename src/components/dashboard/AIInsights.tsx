import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Clock, Brain, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIJobAgent } from '@/services/AIJobAgent';
import { Job, UserProfile } from '@/types/job';

interface AIInsight {
  type: string;
  result: any;
  timestamp: string;
  userId: string;
}

interface AIInsightsProps {
  userProfile?: UserProfile;
  onManualApply?: (job: Job) => void;
  onNavigateTab?: (tab: string) => void;
}

export function AIInsights({ userProfile, onManualApply, onNavigateTab }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInsights();
    const interval = setInterval(loadInsights, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadInsights = () => {
    const stored = localStorage.getItem('ai_agent_results');
    if (stored) {
      const data = JSON.parse(stored);
      setInsights(data.slice(0, 6)); // Show latest 6 insights
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'jobMatching': return Brain;
      case 'careerAnalysis': return TrendingUp;
      case 'marketIntelligence': return Sparkles;
      default: return Clock;
    }
  };

  const getAgentColor = (type: string) => {
    switch (type) {
      case 'jobMatching': return 'bg-blue-100 text-blue-700';
      case 'careerAnalysis': return 'bg-green-100 text-green-700';
      case 'marketIntelligence': return 'bg-purple-100 text-purple-700';
      case 'skillDevelopment': return 'bg-orange-100 text-orange-700';
      case 'networkDiscovery': return 'bg-pink-100 text-pink-700';
      case 'applicationOptimization': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatInsight = (insight: AIInsight) => {
    if (typeof insight.result === 'string') {
      return insight.result.substring(0, 150) + '...';
    }
    
    if (insight.result?.text) {
      return insight.result.text.substring(0, 150) + '...';
    }

    // Handle structured data
    if (insight.type === 'jobMatching' && insight.result?.matchScore) {
      return `Found ${Math.round(insight.result.matchScore * 100)}% job match with key skills alignment`;
    }
    
    if (insight.type === 'careerAnalysis' && insight.result?.skillGaps) {
      return `Identified ${insight.result.skillGaps.length} skill gaps for career advancement`;
    }
    
    if (insight.type === 'marketIntelligence' && insight.result?.growingSkills) {
      return `Market analysis shows ${insight.result.growingSkills.length} growing skills in demand`;
    }

    return 'AI analysis completed successfully';
  };
  const fetchResumeText = async (): Promise<string> => {
    try {
      if (userProfile?.resume_url) {
        const { data, error } = await supabase.functions.invoke('extract-resume-text', {
          body: { resumeUrl: userProfile.resume_url }
        });
        if (error) throw error;
        return data?.text || '';
      }
    } catch (e) {
      console.error('Failed to extract resume text', e);
    }
    return '';
  };

  const handleAutoApplyTopMatch = async () => {
    if (!userProfile) {
      toast({ title: 'Profile required', description: 'Complete your profile to apply.', variant: 'destructive' });
      return;
    }
    setIsApplying(true);
    try {
      const resumeText = await fetchResumeText();
      const matches = await AIJobAgent.findMatchingJobs(userProfile, resumeText || '');
      if (!matches.length) {
        toast({ title: 'No matches yet', description: 'Activate Job Matching to get opportunities.' });
        return;
      }
      const top = matches[0].job;
      const { data, error } = await supabase.functions.invoke('generate-cover-letter', {
        body: {
          jobDescription: `${top.description}\n\nRequirements:\n${top.requirements}`,
          userProfile,
          resumeText,
          jobTitle: top.title,
          company: top.company,
          enhanced: true
        }
      });
      if (error) throw error;
      const coverLetter = data?.coverLetter || '';
      const { error: insertError } = await supabase.from('applications').insert({
        job_id: top.id,
        applicant_id: userProfile.id,
        cover_letter: coverLetter,
        resume_url: userProfile.resume_url || null,
        status: 'pending',
        auto_applied: true,
      });
      if (insertError) throw insertError;
      toast({ title: 'Auto-applied', description: `Applied to ${top.title} at ${top.company}` });
      const existing = JSON.parse(localStorage.getItem('ai_agent_results') || '[]');
      existing.unshift({ type: 'autoApply', result: { jobTitle: top.title, company: top.company }, timestamp: new Date().toISOString(), userId: userProfile.id });
      localStorage.setItem('ai_agent_results', JSON.stringify(existing.slice(0, 50)));
      loadInsights();
      onNavigateTab?.('applications');
    } catch (e: any) {
      console.error('Auto-apply failed', e);
      toast({ title: 'Auto-apply failed', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsApplying(false);
    }
  };

  const handleManualApplyTopMatch = async () => {
    if (!userProfile) return;
    const resumeText = await fetchResumeText();
    const matches = await AIJobAgent.findMatchingJobs(userProfile, resumeText || '');
    if (!matches.length) {
      toast({ title: 'No matches yet', description: 'Activate Job Matching to get opportunities.' });
      return;
    }
    onManualApply?.(matches[0].job);
  };
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Real-time AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Activate AI agents to see real-time insights here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Real-time AI Insights
          <Badge variant="secondary" className="ml-auto">
            {insights.length} recent
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-between mb-4">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleManualApplyTopMatch}>Review top match</Button>
            <Button size="sm" onClick={handleAutoApplyTopMatch} disabled={isApplying}>
              <Rocket className="h-4 w-4 mr-1" /> {isApplying ? 'Applying...' : 'Auto-apply top match'}
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = getAgentIcon(insight.type);
            const colorClass = getAgentColor(insight.type);
            
            return (
              <div
                key={`${insight.timestamp}-${index}`}
                className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm capitalize">
                      {insight.type.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {new Date(insight.timestamp).toLocaleTimeString()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatInsight(insight)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}