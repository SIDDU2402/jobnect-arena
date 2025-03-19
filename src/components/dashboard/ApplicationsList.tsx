
import { useState } from "react";
import { JobApplication } from "@/types/job";
import { formatDistanceToNow } from "date-fns";
import { 
  BadgeCheck, 
  BarChart2, 
  Clock,
  Download, 
  Eye,
  FileText, 
  MessageSquare, 
  Percent,
  ShieldCheck, 
  Shuffle,
  Trophy,
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface ApplicationsListProps {
  applications: JobApplication[];
  onUpdateStatus: (id: string, status: 'pending' | 'reviewed' | 'rejected' | 'approved') => void;
}

const ApplicationsList = ({ applications, onUpdateStatus }: ApplicationsListProps) => {
  const { toast } = useToast();
  const [expandedApplication, setExpandedApplication] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'score' | 'date'>('score');

  const toggleApplicationDetails = (applicationId: string) => {
    setExpandedApplication(expandedApplication === applicationId ? null : applicationId);
  };

  // Calculate the combined score (average of ATS and similarity)
  const getCombinedScore = (app: JobApplication): number => {
    const atsScore = app.ats_score || 0;
    const similarityScore = app.similarity_score || 0;
    return Math.round((atsScore + similarityScore) / 2);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <BadgeCheck className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'reviewed':
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const handleDownloadResume = (url: string | null) => {
    if (!url) {
      toast({
        title: "No resume available",
        description: "This applicant did not upload a resume.",
        variant: "destructive",
      });
      return;
    }
    
    window.open(url, '_blank');
  };

  // Sort applications based on current sort option
  const sortedApplications = [...applications].sort((a, b) => {
    if (sortOption === 'score') {
      return getCombinedScore(b) - getCombinedScore(a);
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as 'score' | 'date')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Ranking</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedApplications.map((application, index) => (
        <div key={application.id} className="border border-border rounded-lg overflow-hidden bg-background relative">
          {sortOption === 'score' && index < 3 && (
            <div className="absolute top-0 right-0">
              <div className={`
                py-1 px-2 rounded-bl-md flex items-center gap-1 text-xs font-medium
                ${index === 0 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 
                  index === 1 ? 'bg-gray-500/20 text-gray-600 dark:text-gray-400' : 
                  'bg-amber-500/20 text-amber-600 dark:text-amber-400'}
              `}>
                <Trophy className="h-3 w-3" />
                <span>Rank #{index + 1}</span>
              </div>
            </div>
          )}

          <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-semibold text-lg mr-2">{application.job?.title}</h3>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                    {getStatusIcon(application.status)}
                    <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>
                      Applicant: {application.applicant?.first_name} {application.applicant?.last_name}
                    </span>
                  </div>
                  <div className="mt-1">Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-secondary/30 px-3 py-1 rounded flex items-center justify-center gap-1.5 text-sm">
                          <BarChart2 className="h-3.5 w-3.5" />
                          <span className="font-medium">ATS: {application.ats_score || 0}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Resume ATS score</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-secondary/30 px-3 py-1 rounded flex items-center justify-center gap-1.5 text-sm">
                          <Shuffle className="h-3.5 w-3.5" />
                          <span className="font-medium">Match: {application.similarity_score || 0}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Resume-job similarity score</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[100px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`bg-secondary/30 px-3 py-1 rounded flex items-center justify-center gap-1.5 text-sm ${getScoreColor(getCombinedScore(application))}`}>
                          <Percent className="h-3.5 w-3.5" />
                          <span className="font-medium">Overall: {getCombinedScore(application)}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Combined score (ATS + similarity match)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleApplicationDetails(application.id)}
                  >
                    {expandedApplication === application.id ? "Hide Details" : "View Details"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {expandedApplication === application.id && (
            <div className="border-t border-border p-4 bg-secondary/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Cover Letter
                  </h4>
                  <div className="bg-background p-3 rounded-md border border-border text-sm h-48 overflow-y-auto">
                    {application.cover_letter || "No cover letter submitted."}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm flex items-center">
                      <FileText className="h-4 w-4 mr-1.5" />
                      Resume
                    </h4>
                    {application.resume_url && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadResume(application.resume_url)}
                      >
                        <Download className="h-4 w-4 mr-1.5" />
                        Download
                      </Button>
                    )}
                  </div>
                  
                  <div className="bg-background p-3 rounded-md border border-border h-48 overflow-y-auto">
                    {application.resume_url ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-sm text-muted-foreground">
                          <FileText className="h-10 w-10 mx-auto mb-2 text-primary/60" />
                          <p>Resume preview not available</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => handleDownloadResume(application.resume_url)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Download Resume
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No resume submitted.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-background p-3 rounded-md border border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-1.5" />
                      Application Status
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Update the status of this application
                    </p>
                  </div>
                  
                  <Select
                    defaultValue={application.status}
                    onValueChange={(value) => onUpdateStatus(application.id, value as any)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ApplicationsList;
