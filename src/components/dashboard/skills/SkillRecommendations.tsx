
import { useState } from "react";
import { Job } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { extractJobSkills, analyzeMissingSkills, generateCourseRecommendations } from "@/utils/skillsAnalysis";
import { BookOpen, ExternalLink } from "lucide-react";

interface SkillRecommendationsProps {
  job: Job;
  resumeText?: string;
}

const SkillRecommendations = ({ job, resumeText = "" }: SkillRecommendationsProps) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  // Extract required skills from job
  const requiredSkills = extractJobSkills(job);
  
  // For simplicity, we're using a mock resume text if none is provided
  const mockResumeText = resumeText || `
    Experienced software developer with 5 years of experience in frontend development.
    Proficient in JavaScript, HTML, CSS, and React.
    Built responsive web applications and collaborated with cross-functional teams.
    Bachelor's degree in Computer Science.
  `;
  
  // Analyze missing skills
  const missingSkills = analyzeMissingSkills(mockResumeText, requiredSkills);
  
  // Generate course recommendations
  const courseRecommendations = generateCourseRecommendations(missingSkills);
  
  return (
    <Card className="p-4 mt-4 bg-secondary/10">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Skills Analysis
          </h3>
          {missingSkills.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              {showRecommendations ? "Hide Recommendations" : "Show Recommendations"}
            </Button>
          )}
        </div>
        
        <div className="mb-3">
          <p className="text-sm text-muted-foreground mb-2">Required Skills:</p>
          <div className="flex flex-wrap gap-2">
            {requiredSkills.map((skill) => (
              <Badge 
                key={skill} 
                variant={missingSkills.includes(skill) ? "destructive" : "default"}
                className="capitalize"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        
        {missingSkills.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground mb-2">Missing Skills:</p>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill) => (
                <Badge key={skill} variant="destructive" className="capitalize">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {showRecommendations && missingSkills.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-3">Recommended Courses to Learn Missing Skills:</h4>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(courseRecommendations).map(([skill, courses]) => (
                <AccordionItem key={skill} value={skill}>
                  <AccordionTrigger className="capitalize">{skill}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="pl-2 space-y-2">
                      {courses.map((course, index) => (
                        <li key={index} className="flex items-center">
                          <ExternalLink className="h-3.5 w-3.5 mr-2 text-primary" />
                          <span className="text-sm">{course}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
        
        {missingSkills.length === 0 && (
          <div className="text-sm p-3 bg-green-50 text-green-700 rounded-md dark:bg-green-900 dark:text-green-100">
            Great job! Your resume already covers all the skills required for this position.
          </div>
        )}
      </div>
    </Card>
  );
};

export default SkillRecommendations;
