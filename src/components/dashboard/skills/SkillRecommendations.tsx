
import { findMissingSkills, getCourseRecommendations } from "@/utils/skillsAnalysis";
import { Job } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

interface SkillRecommendationsProps {
  job: Job;
  resumeText: string;
}

const SkillRecommendations = ({ job, resumeText }: SkillRecommendationsProps) => {
  // Find missing skills by comparing job description with resume text
  const missingSkills = findMissingSkills(
    `${job.description} ${job.requirements}`, 
    resumeText
  );
  
  // Get course recommendations for missing skills
  const courseRecommendations = getCourseRecommendations(missingSkills);

  if (missingSkills.length === 0) {
    return (
      <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md">
        <p className="font-medium">Great match! Your resume appears to cover all the required skills.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-md space-y-4">
      <div className="space-y-2">
        <h3 className="text-base font-medium">Skill Gap Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Based on analysis of your resume and the job description, you might want to highlight these skills:
        </p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {missingSkills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="courses">
          <AccordionTrigger className="text-sm">View recommended courses</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {Object.entries(courseRecommendations).map(([skill, courses]) => (
                <div key={skill} className="space-y-2">
                  <h4 className="text-sm font-medium">{skill}</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                    {courses.map((course, index) => (
                      <li key={index}>{course}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SkillRecommendations;
