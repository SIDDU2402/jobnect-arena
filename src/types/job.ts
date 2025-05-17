
export interface Job {
  id: string;
  created_at: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  requirements: string;
  employer_id: string;
  status: string | null;
  logo?: string | null;
  featured?: boolean;
}

export interface JobApplication {
  id: string;
  created_at: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string | null;
  resume_url: string | null;
  ats_score: number | null;
  status: string | null;
  job: Job;
  similarity_score?: number;
  applicant?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  avatar_url: string | null;
  role: string;
  skills?: string[];
  professional_summary?: string | null;
  resume_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
}
