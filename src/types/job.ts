
export interface Job {
  id: string;
  employer_id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  requirements: string;
  created_at: string;
  status: 'active' | 'closed' | 'draft' | string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  resume_url: string | null;
  cover_letter: string | null;
  status: 'pending' | 'reviewed' | 'rejected' | 'approved' | string;
  ats_score: number | null;
  similarity_score?: number | null; // New field for cosine similarity
  created_at: string;
  updated_at: string;
  // Joined data
  job?: Job;
  applicant?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}
