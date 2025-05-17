
import { findMissingSkills, getCourseRecommendations } from "@/utils/skillsAnalysis";
import { Job } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface SkillRecommendationsProps {
  job: Job;
  resumeText: string;
}

interface CourseLink {
  title: string;
  url: string;
  platform: string;
}

// Map of platforms to their colors
const platformColors: Record<string, string> = {
  "Coursera": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Udemy": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "edX": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "LinkedIn": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  "YouTube": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

const SkillRecommendations = ({ job, resumeText }: SkillRecommendationsProps) => {
  // Find missing skills by comparing job description with resume text
  const missingSkills = findMissingSkills(
    `${job.description} ${job.requirements}`, 
    resumeText
  );
  
  // Generate course recommendations with links
  const generateCourseLinks = (skill: string): CourseLink[] => {
    // Map of real course links for common skills
    const realCourses: Record<string, CourseLink[]> = {
      "javascript": [
        { title: "The Complete JavaScript Course", url: "https://www.udemy.com/course/the-complete-javascript-course/", platform: "Udemy" },
        { title: "JavaScript - The Complete Guide", url: "https://www.udemy.com/course/javascript-the-complete-guide-2020-beginner-advanced/", platform: "Udemy" },
        { title: "JavaScript Programming Basics", url: "https://www.coursera.org/learn/javascript-basics", platform: "Coursera" }
      ],
      "react": [
        { title: "Modern React with Redux", url: "https://www.udemy.com/course/react-redux/", platform: "Udemy" },
        { title: "React - The Complete Guide", url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/", platform: "Udemy" },
        { title: "Meta React Native Specialization", url: "https://www.coursera.org/specializations/meta-react-native", platform: "Coursera" }
      ],
      "python": [
        { title: "Complete Python Bootcamp", url: "https://www.udemy.com/course/complete-python-bootcamp/", platform: "Udemy" },
        { title: "Python for Everybody", url: "https://www.coursera.org/specializations/python", platform: "Coursera" },
        { title: "Python for Data Science", url: "https://www.edx.org/course/python-for-data-science", platform: "edX" }
      ],
      "node": [
        { title: "NodeJS - The Complete Guide", url: "https://www.udemy.com/course/nodejs-the-complete-guide/", platform: "Udemy" },
        { title: "Node.js Developer Course", url: "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/", platform: "Udemy" }
      ],
      "sql": [
        { title: "The Complete SQL Bootcamp", url: "https://www.udemy.com/course/the-complete-sql-bootcamp/", platform: "Udemy" },
        { title: "SQL for Data Science", url: "https://www.coursera.org/learn/sql-for-data-science", platform: "Coursera" }
      ],
      "machine learning": [
        { title: "Machine Learning by Andrew Ng", url: "https://www.coursera.org/learn/machine-learning", platform: "Coursera" },
        { title: "Machine Learning A-Z", url: "https://www.udemy.com/course/machinelearning/", platform: "Udemy" }
      ],
      "aws": [
        { title: "AWS Certified Solutions Architect", url: "https://www.udemy.com/course/aws-certified-solutions-architect-associate/", platform: "Udemy" },
        { title: "AWS Cloud Technical Essentials", url: "https://www.coursera.org/learn/aws-cloud-technical-essentials", platform: "Coursera" }
      ],
      "design": [
        { title: "UI/UX Design Specialization", url: "https://www.coursera.org/specializations/ui-ux-design", platform: "Coursera" },
        { title: "Web Design for Beginners", url: "https://www.udemy.com/course/web-design-for-beginners-real-world-coding-in-html-css/", platform: "Udemy" }
      ],
      "typescript": [
        { title: "Understanding TypeScript", url: "https://www.udemy.com/course/understanding-typescript/", platform: "Udemy" },
        { title: "TypeScript Complete Course", url: "https://www.udemy.com/course/typescript-the-complete-developers-guide/", platform: "Udemy" }
      ],
      "git": [
        { title: "Git Complete: The Definitive Guide", url: "https://www.udemy.com/course/git-complete/", platform: "Udemy" },
        { title: "Version Control with Git", url: "https://www.coursera.org/learn/version-control-with-git", platform: "Coursera" }
      ]
    };
    
    // Return real courses if available, otherwise generate placeholder data
    if (skill.toLowerCase() in realCourses) {
      return realCourses[skill.toLowerCase()];
    }
    
    // Create generic course recommendations for skills without predefined courses
    const platforms = ["Coursera", "Udemy", "edX", "LinkedIn", "YouTube"];
    const numCourses = Math.floor(Math.random() * 2) + 1;
    const courses: CourseLink[] = [];
    
    for (let i = 0; i < numCourses; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const searchQuery = encodeURIComponent(skill);
      let url = "";
      
      switch (platform) {
        case "Coursera":
          url = `https://www.coursera.org/search?query=${searchQuery}`;
          break;
        case "Udemy":
          url = `https://www.udemy.com/courses/search/?q=${searchQuery}`;
          break;
        case "edX":
          url = `https://www.edx.org/search?q=${searchQuery}`;
          break;
        case "LinkedIn":
          url = `https://www.linkedin.com/learning/search?keywords=${searchQuery}`;
          break;
        case "YouTube":
          url = `https://www.youtube.com/results?search_query=${searchQuery}+tutorial`;
          break;
      }
      
      courses.push({
        title: `Learn ${skill} on ${platform}`,
        url,
        platform
      });
    }
    
    return courses;
  };
  
  // Generate all course recommendations
  const courseRecommendations: Record<string, CourseLink[]> = {};
  missingSkills.forEach(skill => {
    courseRecommendations[skill] = generateCourseLinks(skill);
  });

  if (missingSkills.length === 0) {
    return (
      <motion.div 
        className="p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="font-medium">Great match! Your resume appears to cover all the required skills.</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-md space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-2">
        <h3 className="text-base font-medium">Skill Gap Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Based on analysis of your resume and the job description, you might want to highlight these skills:
        </p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {missingSkills.map((skill, index) => (
            <motion.div
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Badge variant="secondary">
                {skill}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="courses">
          <AccordionTrigger className="text-sm">View recommended courses</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {Object.entries(courseRecommendations).map(([skill, courses]) => (
                <motion.div 
                  key={skill} 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h4 className="text-sm font-medium">{skill}</h4>
                  <ul className="space-y-2">
                    {courses.map((course, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-center justify-between rounded-md p-2 hover:bg-secondary/50"
                        whileHover={{ x: 3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{course.title}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${platformColors[course.platform] || ""}`}
                          >
                            {course.platform}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-1 text-primary"
                          asChild
                        >
                          <a href={course.url} target="_blank" rel="noopener noreferrer">
                            <span className="text-xs">Visit</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

export default SkillRecommendations;
