
import { useState, useEffect } from "react";
import { 
  findMissingSkills, 
  getCourseRecommendations,
  extractSkills,
  calculateCosineSimilarity
} from "@/utils/skillsAnalysis";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  ChevronRight, 
  Lightbulb, 
  ListChecks, 
  School 
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Job } from "@/types/job";

interface SkillRecommendationsProps {
  jobDescription?: string;
  resumeText: string;
  job?: Job;
}

const SkillRecommendations = ({ jobDescription, resumeText, job }: SkillRecommendationsProps) => {
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [courseRecommendations, setCourseRecommendations] = useState<Record<string, string[]>>({});
  const [jobSkills, setJobSkills] = useState<string[]>([]);
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);
  
  useEffect(() => {
    // Use job description from props or from job object
    const description = jobDescription || (job ? `${job.description} ${job.requirements}` : '');
    
    if (description && resumeText) {
      // Extract skills from job description and resume
      const extractedJobSkills = extractSkills(description);
      const extractedResumeSkills = extractSkills(resumeText);
      
      setJobSkills(extractedJobSkills);
      setResumeSkills(extractedResumeSkills);
      
      // Find missing skills
      const missing = findMissingSkills(description, resumeText);
      setMissingSkills(missing);
      
      // Get course recommendations for missing skills
      const recommendations = getCourseRecommendations(missing);
      setCourseRecommendations(recommendations);
    }
  }, [jobDescription, resumeText, job]);
  
  if ((!jobDescription && !job) || !resumeText) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Skills Analysis</CardTitle>
          <CardDescription>
            Enter job details and upload your resume to get skill recommendations
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          Skills Gap Analysis
        </CardTitle>
        <CardDescription>
          We analyzed the job requirements and your resume to identify skill gaps
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <ListChecks className="h-4 w-4 mr-1.5 text-primary" />
              Job Required Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {jobSkills.length > 0 ? (
                jobSkills.map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="secondary"
                    className={
                      resumeSkills.includes(skill) 
                        ? "bg-green-500/10 text-green-700 hover:bg-green-500/20 hover:text-green-800"
                        : "bg-red-500/10 text-red-700 hover:bg-red-500/20 hover:text-red-800"
                    }
                  >
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No specific skills detected in job description</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <ListChecks className="h-4 w-4 mr-1.5 text-primary" />
              Your Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {resumeSkills.length > 0 ? (
                resumeSkills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No specific skills detected in your resume</p>
              )}
            </div>
          </div>
        </div>
        
        {missingSkills.length > 0 ? (
          <>
            <h4 className="text-sm font-medium mb-3 flex items-center border-t pt-4">
              <School className="h-4 w-4 mr-1.5 text-primary" />
              Course Recommendations for Missing Skills
            </h4>
            
            <Accordion type="single" collapsible className="w-full">
              {missingSkills.map((skill) => (
                <AccordionItem key={skill} value={skill}>
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <span className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-primary" />
                      <span>Courses for <span className="font-semibold">{skill}</span></span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pl-6 mt-2">
                      {courseRecommendations[skill]?.map((course, index) => (
                        <li key={index} className="text-sm flex items-center group">
                          <ChevronRight className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span>{course}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => window.open(`https://www.coursera.org/search?query=${encodeURIComponent(course)}`, '_blank')}
                          >
                            View
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        ) : (
          <div className="text-center py-4 border-t">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Great job! Your skills match the job requirements.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillRecommendations;
