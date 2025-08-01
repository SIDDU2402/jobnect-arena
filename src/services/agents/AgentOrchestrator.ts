import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Job } from "@/types/job";

export interface AgentTask {
  id: string;
  type: 'job_matching' | 'career_analysis' | 'market_intelligence' | 'application_optimization' | 'skill_development' | 'network_discovery';
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  userId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  agentId?: string;
}

export interface AgentCapability {
  type: string;
  description: string;
  estimatedTime: number; // in milliseconds
  successRate: number; // percentage
}

export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private activeAgents: Map<string, any> = new Map();
  private taskQueue: AgentTask[] = [];
  private isProcessing = false;

  private constructor() {
    this.initializeAgents();
    this.startTaskProcessor();
  }

  static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  private async initializeAgents() {
    // Initialize all specialized agents
    const { JobMatchingAgent } = await import('./JobMatchingAgent');
    const { CareerAnalysisAgent } = await import('./CareerAnalysisAgent');
    const { MarketIntelligenceAgent } = await import('./MarketIntelligenceAgent');
    const { ApplicationOptimizationAgent } = await import('./ApplicationOptimizationAgent');
    const { SkillDevelopmentAgent } = await import('./SkillDevelopmentAgent');
    const { NetworkDiscoveryAgent } = await import('./NetworkDiscoveryAgent');

    this.activeAgents.set('job_matching', new JobMatchingAgent());
    this.activeAgents.set('career_analysis', new CareerAnalysisAgent());
    this.activeAgents.set('market_intelligence', new MarketIntelligenceAgent());
    this.activeAgents.set('application_optimization', new ApplicationOptimizationAgent());
    this.activeAgents.set('skill_development', new SkillDevelopmentAgent());
    this.activeAgents.set('network_discovery', new NetworkDiscoveryAgent());
  }

  async scheduleTask(task: Omit<AgentTask, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const agentTask: AgentTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date()
    };

    // Insert task into priority queue
    this.insertByPriority(agentTask);
    
    // Log task creation
    await this.logTask(agentTask);
    
    return agentTask.id;
  }

  private insertByPriority(task: AgentTask) {
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const insertIndex = this.taskQueue.findIndex(
      existingTask => priorityOrder[task.priority] < priorityOrder[existingTask.priority]
    );
    
    if (insertIndex === -1) {
      this.taskQueue.push(task);
    } else {
      this.taskQueue.splice(insertIndex, 0, task);
    }
  }

  private async startTaskProcessor() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (true) {
      if (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!;
        await this.processTask(task);
      } else {
        // Wait 5 seconds before checking for new tasks
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async processTask(task: AgentTask) {
    try {
      task.status = 'in_progress';
      await this.updateTaskStatus(task);

      const agent = this.activeAgents.get(task.type);
      if (!agent) {
        throw new Error(`No agent found for task type: ${task.type}`);
      }

      const result = await agent.execute(task.payload);
      
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      
      await this.updateTaskStatus(task);
      await this.notifyTaskCompletion(task);
      
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
      task.status = 'failed';
      task.result = { error: error.message };
      await this.updateTaskStatus(task);
    }
  }

  private async logTask(task: AgentTask) {
    try {
      await supabase.from('agent_tasks').insert({
        id: task.id,
        type: task.type,
        priority: task.priority,
        user_id: task.userId,
        status: task.status,
        payload: task.payload,
        created_at: task.createdAt.toISOString()
      });
    } catch (error) {
      console.error('Failed to log task:', error);
    }
  }

  private async updateTaskStatus(task: AgentTask) {
    try {
      await supabase.from('agent_tasks').update({
        status: task.status,
        result: task.result,
        completed_at: task.completedAt?.toISOString()
      }).eq('id', task.id);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }

  private async notifyTaskCompletion(task: AgentTask) {
    // Send real-time notification to user
    try {
      await supabase.from('notifications').insert({
        user_id: task.userId,
        type: 'agent_task_completed',
        title: `Agent Task Completed`,
        message: `Your ${task.type.replace('_', ' ')} task has been completed successfully.`,
        metadata: {
          taskId: task.id,
          taskType: task.type,
          result: task.result
        }
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async getTaskStatus(taskId: string): Promise<AgentTask | null> {
    try {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (error) throw error;
      return data as AgentTask;
    } catch (error) {
      console.error('Failed to get task status:', error);
      return null;
    }
  }

  async getUserTasks(userId: string, limit = 10): Promise<AgentTask[]> {
    try {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as AgentTask[];
    } catch (error) {
      console.error('Failed to get user tasks:', error);
      return [];
    }
  }

  async getAgentCapabilities(): Promise<AgentCapability[]> {
    return [
      {
        type: 'job_matching',
        description: 'Advanced AI-powered job matching with semantic analysis and career trajectory alignment',
        estimatedTime: 30000,
        successRate: 92
      },
      {
        type: 'career_analysis',
        description: 'Comprehensive career path analysis with predictive insights and growth recommendations',
        estimatedTime: 45000,
        successRate: 88
      },
      {
        type: 'market_intelligence',
        description: 'Real-time market analysis, salary trends, and competitive intelligence',
        estimatedTime: 60000,
        successRate: 95
      },
      {
        type: 'application_optimization',
        description: 'Automated application enhancement with ATS optimization and success prediction',
        estimatedTime: 25000,
        successRate: 89
      },
      {
        type: 'skill_development',
        description: 'Personalized learning paths and skill gap analysis with course recommendations',
        estimatedTime: 40000,
        successRate: 91
      },
      {
        type: 'network_discovery',
        description: 'Professional network analysis and warm introduction opportunities',
        estimatedTime: 35000,
        successRate: 85
      }
    ];
  }

  async getSystemMetrics(): Promise<any> {
    try {
      const { data: tasks, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const failedTasks = tasks.filter(t => t.status === 'failed').length;
      const avgCompletionTime = tasks
        .filter(t => t.status === 'completed' && t.completed_at)
        .reduce((acc, t) => {
          const start = new Date(t.created_at).getTime();
          const end = new Date(t.completed_at!).getTime();
          return acc + (end - start);
        }, 0) / completedTasks || 0;

      return {
        totalTasks,
        completedTasks,
        failedTasks,
        successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        avgCompletionTime: Math.round(avgCompletionTime / 1000), // in seconds
        activeAgents: this.activeAgents.size,
        queueLength: this.taskQueue.length
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return {};
    }
  }
}