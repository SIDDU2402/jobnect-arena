// Extended Supabase types for new tables not yet in the generated types
export interface AgentTask {
  id: string;
  type: string;
  priority: string;
  user_id: string;
  status: string;
  payload: any;
  result?: any;
  created_at: string;
  completed_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  read: boolean;
  created_at: string;
}

export interface AgentAnalytics {
  id: string;
  agent_type: string;
  user_id?: string;
  session_data?: any;
  created_at: string;
}

export interface MarketIntelligenceCache {
  id: string;
  cache_key: string;
  data: any;
  expires_at: string;
  created_at: string;
}