import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Job } from "@/types/job";

export interface AgentTaskData {
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
  private taskQueue: AgentTaskData[] = [];
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
    try {
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
    } catch (error) {
      console.error('Failed to initialize agents:', error);
    }
  }

  async scheduleTask(task: Omit<AgentTaskData, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const agentTask: AgentTaskData = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date()
    };

    // Insert task into priority queue
    this.insertByPriority(agentTask);
    
    // Store task locally (until database types are updated)
    this.storeTaskLocally(agentTask);
    
    return agentTask.id;
  }

  private insertByPriority(task: AgentTaskData) {
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

  private async processTask(task: AgentTaskData) {
    try {
      task.status = 'in_progress';
      this.updateTaskLocally(task);

      const agent = this.activeAgents.get(task.type);
      if (!agent) {
        throw new Error(`No agent found for task type: ${task.type}`);
      }

      const result = await agent.execute(task.payload);
      
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      
      this.updateTaskLocally(task);
      await this.notifyTaskCompletion(task);
      
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
      task.status = 'failed';
      task.result = { error: error.message };
      this.updateTaskLocally(task);
    }
  }

  private storeTaskLocally(task: AgentTaskData) {
    try {
      const tasks = JSON.parse(localStorage.getItem('agent_tasks') || '[]');
      tasks.push({
        ...task,
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt?.toISOString()
      });
      localStorage.setItem('agent_tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to store task locally:', error);
    }
  }

  private updateTaskLocally(task: AgentTaskData) {
    try {
      const tasks = JSON.parse(localStorage.getItem('agent_tasks') || '[]');
      const taskIndex = tasks.findIndex((t: any) => t.id === task.id);
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...task,
          createdAt: task.createdAt.toISOString(),
          completedAt: task.completedAt?.toISOString()
        };
        localStorage.setItem('agent_tasks', JSON.stringify(tasks));
      }
    } catch (error) {
      console.error('Failed to update task locally:', error);
    }
  }

  private async notifyTaskCompletion(task: AgentTaskData) {
    // Store notification locally for now
    try {
      const notifications = JSON.parse(localStorage.getItem('agent_notifications') || '[]');
      notifications.push({
        id: `notif_${Date.now()}`,
        userId: task.userId,
        type: 'agent_task_completed',
        title: 'Agent Task Completed',
        message: `Your ${task.type.replace('_', ' ')} task has been completed successfully.`,
        metadata: {
          taskId: task.id,
          taskType: task.type,
          result: task.result
        },
        read: false,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('agent_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  async getTaskStatus(taskId: string): Promise<AgentTaskData | null> {
    try {
      const tasks = JSON.parse(localStorage.getItem('agent_tasks') || '[]');
      const task = tasks.find((t: any) => t.id === taskId);
      if (task) {
        return {
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get task status:', error);
      return null;
    }
  }

  async getUserTasks(userId: string, limit = 10): Promise<AgentTaskData[]> {
    try {
      const tasks = JSON.parse(localStorage.getItem('agent_tasks') || '[]');
      return tasks
        .filter((t: any) => t.userId === userId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
        .map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        }));
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
      const tasks = JSON.parse(localStorage.getItem('agent_tasks') || '[]');
      const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
      const recentTasks = tasks.filter((t: any) => new Date(t.createdAt).getTime() > last24Hours);

      const totalTasks = recentTasks.length;
      const completedTasks = recentTasks.filter((t: any) => t.status === 'completed').length;
      const failedTasks = recentTasks.filter((t: any) => t.status === 'failed').length;
      const avgCompletionTime = recentTasks
        .filter((t: any) => t.status === 'completed' && t.completedAt)
        .reduce((acc: number, t: any) => {
          const start = new Date(t.createdAt).getTime();
          const end = new Date(t.completedAt).getTime();
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
      return {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        successRate: 0,
        avgCompletionTime: 0,
        activeAgents: this.activeAgents.size,
        queueLength: this.taskQueue.length
      };
    }
  }
}