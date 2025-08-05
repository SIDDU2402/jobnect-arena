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
      // Test Gemini AI connection
      const { data } = await supabase.functions.invoke('gemini-ai', {
        body: {
          prompt: 'Test connection',
          agentType: 'general',
          maxTokens: 10
        }
      });
      
      if (data?.success) {
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
      let prompt = '';
      let context = '';

      switch (agentType) {
        case 'jobMatching':
          prompt = 'Analyze current job market for real-time job matching opportunities';
          context = `User skills: ${userProfile?.skills?.join(', ') || 'No skills listed'}`;
          break;
        case 'careerAnalysis':
          prompt = 'Provide career analysis and growth recommendations';
          context = `Professional summary: ${userProfile?.professional_summary || 'No summary available'}`;
          break;
        case 'marketIntelligence':
          prompt = 'Analyze current job market trends and opportunities';
          context = 'Real-time market intelligence analysis';
          break;
        case 'skillDevelopment':
          prompt = 'Recommend skill development paths based on market demands';
          context = `Current skills: ${userProfile?.skills?.join(', ') || 'No skills listed'}`;
          break;
        case 'networkDiscovery':
          prompt = 'Analyze professional networking opportunities';
          context = 'Professional network analysis and recommendations';
          break;
        case 'applicationOptimization':
          prompt = 'Optimize job application strategy and materials';
          context = 'Application optimization and success prediction';
          break;
        default:
          prompt = 'General AI assistance for career development';
      }

      const { data } = await supabase.functions.invoke('gemini-ai', {
        body: {
          prompt,
          context,
          agentType,
          temperature: 0.7,
          maxTokens: 1500
        }
      });

      if (data?.success) {
        toast({
          title: "AI Agent Activated",
          description: `${agentType} agent is now providing real-time insights`,
        });
        
        // Store AI response for dashboard display
        const agentData = {
          type: agentType,
          result: data.result,
          timestamp: new Date().toISOString(),
          userId: userProfile?.id
        };
        
        const existing = JSON.parse(localStorage.getItem('ai_agent_results') || '[]');
        existing.unshift(agentData);
        localStorage.setItem('ai_agent_results', JSON.stringify(existing.slice(0, 50)));
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
              AI agents are currently offline. Please check your Gemini API configuration.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}