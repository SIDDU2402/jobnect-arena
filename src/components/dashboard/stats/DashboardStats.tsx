
import { Job, JobApplication } from "@/types/job";
import { Briefcase, FileText, Users, BarChart } from "lucide-react";

interface DashboardStatsProps {
  jobs: Job[] | undefined;
  applications: JobApplication[] | undefined;
}

const DashboardStats = ({ jobs, applications }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-background border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground">Active Jobs</span>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-bold">
          {jobs?.filter(job => job.status === 'active').length || 0}
        </div>
        <div className="text-xs text-muted-foreground">Total job postings</div>
      </div>

      <div className="bg-background border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground">Applications</span>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-bold">
          {applications?.length || 0}
        </div>
        <div className="text-xs text-muted-foreground">Total applications received</div>
      </div>

      <div className="bg-background border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground">Pending Reviews</span>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-bold">
          {applications?.filter(app => app.status === 'pending').length || 0}
        </div>
        <div className="text-xs text-muted-foreground">Applications to review</div>
      </div>

      <div className="bg-background border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground">Approved</span>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-bold">
          {applications?.filter(app => app.status === 'approved').length || 0}
        </div>
        <div className="text-xs text-muted-foreground">Candidates approved</div>
      </div>
    </div>
  );
};

export default DashboardStats;
