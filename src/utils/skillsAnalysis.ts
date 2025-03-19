
import { Job } from "@/types/job";

// Extract skills from job description and requirements
export const extractJobSkills = (job: Job): string[] => {
  const combinedText = `${job.description} ${job.requirements}`.toLowerCase();
  
  // Common technical skills to look for (simplified version)
  const commonSkills = [
    "javascript", "typescript", "react", "angular", "vue", "node.js", "python", 
    "java", "c#", ".net", "php", "ruby", "golang", "rust", "swift", "kotlin",
    "sql", "nosql", "mongodb", "postgresql", "mysql", "oracle", "aws", "azure", 
    "gcp", "docker", "kubernetes", "devops", "ci/cd", "git", "agile", "scrum",
    "machine learning", "ai", "data science", "blockchain", "ui/ux", "figma",
    "adobe xd", "sketch", "html", "css", "sass", "less", "responsive design",
    "mobile development", "android", "ios", "flutter", "react native"
  ];
  
  return commonSkills.filter(skill => combinedText.includes(skill));
};

// Mock function to analyze resume and return missing skills
// In a real app, this would use NLP or be connected to an AI service
export const analyzeMissingSkills = (resumeText: string, requiredSkills: string[]): string[] => {
  const lowerCaseResume = resumeText.toLowerCase();
  return requiredSkills.filter(skill => !lowerCaseResume.includes(skill));
};

// Generate course recommendations for missing skills
export const generateCourseRecommendations = (missingSkills: string[]): Record<string, string[]> => {
  const courseRecommendations: Record<string, string[]> = {};
  
  // Mock course recommendations
  const coursesBySkill: Record<string, string[]> = {
    "javascript": [
      "JavaScript Fundamentals by Codecademy",
      "JavaScript: Understanding the Weird Parts on Udemy",
      "Modern JavaScript From The Beginning by Brad Traversy"
    ],
    "typescript": [
      "TypeScript Essential Training on LinkedIn Learning",
      "Understanding TypeScript by Maximilian Schwarzmüller",
      "TypeScript: The Complete Developer's Guide by Stephen Grider"
    ],
    "react": [
      "React - The Complete Guide by Academind",
      "Epic React by Kent C. Dodds",
      "React for Beginners by Wes Bos"
    ],
    "python": [
      "Python for Everybody by University of Michigan (Coursera)",
      "Complete Python Developer in 2023 by Andrei Neagoie",
      "Python Crash Course by Eric Matthes (Book)"
    ],
    "node.js": [
      "Node.js, Express, MongoDB & More: The Complete Bootcamp by Jonas Schmedtmann",
      "Learn and Understand NodeJS by Anthony Alicea",
      "NodeJS - The Complete Guide by Maximilian Schwarzmüller"
    ],
    "sql": [
      "The Complete SQL Bootcamp by Jose Portilla",
      "Introduction to SQL by Khan Academy",
      "SQL for Data Analysis by Udacity"
    ],
    "aws": [
      "AWS Certified Solutions Architect Associate by A Cloud Guru",
      "AWS Certified Developer Associate by Stephane Maarek",
      "AWS Fundamentals: Going Cloud-Native on Coursera"
    ],
    "machine learning": [
      "Machine Learning by Andrew Ng (Coursera)",
      "Machine Learning A-Z by Kirill Eremenko",
      "Fast.ai Practical Deep Learning for Coders"
    ]
  };
  
  missingSkills.forEach(skill => {
    if (coursesBySkill[skill]) {
      courseRecommendations[skill] = coursesBySkill[skill];
    } else {
      courseRecommendations[skill] = [
        `${skill.charAt(0).toUpperCase() + skill.slice(1)} Essential Training on LinkedIn Learning`,
        `Complete ${skill.charAt(0).toUpperCase() + skill.slice(1)} Course on Udemy`,
        `${skill.charAt(0).toUpperCase() + skill.slice(1)} Fundamentals on Pluralsight`
      ];
    }
  });
  
  return courseRecommendations;
};

// Cosine similarity calculation between job requirements and resume
export const calculateCosineSimilarity = (jobText: string, resumeText: string): number => {
  // Function to count word frequencies in a text
  const getWordFrequencies = (text: string): Record<string, number> => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const frequencies: Record<string, number> = {};
    
    words.forEach(word => {
      frequencies[word] = (frequencies[word] || 0) + 1;
    });
    
    return frequencies;
  };
  
  // Get word frequencies for both texts
  const jobFreq = getWordFrequencies(jobText);
  const resumeFreq = getWordFrequencies(resumeText);
  
  // Get unique words from both texts
  const uniqueWords = new Set([...Object.keys(jobFreq), ...Object.keys(resumeFreq)]);
  
  // Calculate dot product
  let dotProduct = 0;
  let jobMagnitude = 0;
  let resumeMagnitude = 0;
  
  uniqueWords.forEach(word => {
    const jobValue = jobFreq[word] || 0;
    const resumeValue = resumeFreq[word] || 0;
    
    dotProduct += jobValue * resumeValue;
    jobMagnitude += jobValue * jobValue;
    resumeMagnitude += resumeValue * resumeValue;
  });
  
  // Calculate magnitudes
  jobMagnitude = Math.sqrt(jobMagnitude);
  resumeMagnitude = Math.sqrt(resumeMagnitude);
  
  // Avoid division by zero
  if (jobMagnitude === 0 || resumeMagnitude === 0) {
    return 0;
  }
  
  // Return cosine similarity
  return dotProduct / (jobMagnitude * resumeMagnitude);
};
