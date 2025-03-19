
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  status: string;
  salary: string;
  created_at: string;
  employer_id: string;
  description: string;
  requirements: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  resume_url: string | null;
  cover_letter: string | null;
  ats_score: number | null;
  similarity_score?: number | null;
  job?: Job;
  applicant?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}
