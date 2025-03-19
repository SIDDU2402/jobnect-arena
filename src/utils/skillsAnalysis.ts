
// Function to tokenize text into words
const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
};

// Calculate term frequency
const calculateTF = (text: string): Record<string, number> => {
  const tokens = tokenize(text);
  const termFreq: Record<string, number> = {};
  
  tokens.forEach(token => {
    termFreq[token] = (termFreq[token] || 0) + 1;
  });
  
  return termFreq;
};

// Calculate cosine similarity between two texts
export const calculateCosineSimilarity = (text1: string, text2: string): number => {
  if (!text1 || !text2) return 0;
  
  const tf1 = calculateTF(text1);
  const tf2 = calculateTF(text2);
  
  // Get all unique terms
  const allTerms = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  
  // Calculate dot product
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  allTerms.forEach(term => {
    const value1 = tf1[term] || 0;
    const value2 = tf2[term] || 0;
    
    dotProduct += value1 * value2;
    magnitude1 += value1 * value1;
    magnitude2 += value2 * value2;
  });
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
};

// Extract skills from text using a simple keyword approach
export const extractSkills = (text: string): string[] => {
  // Common tech and professional skills
  const skillKeywords = [
    "javascript", "typescript", "html", "css", "react", "vue", "angular", 
    "node", "express", "mongodb", "sql", "postgresql", "mysql", "graphql",
    "rest", "api", "aws", "azure", "gcp", "docker", "kubernetes", "python",
    "django", "flask", "ruby", "rails", "php", "laravel", "java", "spring",
    "c#", ".net", "scala", "swift", "kotlin", "flutter", "dart", "mobile",
    "android", "ios", "react native", "design", "figma", "sketch", "adobe",
    "photoshop", "illustrator", "xd", "ui", "ux", "frontend", "backend",
    "fullstack", "devops", "cicd", "git", "github", "gitlab", "product",
    "agile", "scrum", "kanban", "marketing", "seo", "analytics", "data",
    "science", "machine learning", "ai", "blockchain", "crypto", "leadership",
    "management", "communication", "teamwork", "problem solving", "critical thinking"
  ];
  
  const textLower = text.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => textLower.includes(skill));
  
  return [...new Set(foundSkills)]; // Remove duplicates
};

// Compare job skills to resume skills and find missing skills
export const findMissingSkills = (jobDescription: string, resumeText: string): string[] => {
  const jobSkills = extractSkills(jobDescription);
  const resumeSkills = extractSkills(resumeText);
  
  // Find skills in job description that are not in resume
  return jobSkills.filter(skill => !resumeSkills.includes(skill));
};

// Get course recommendations for missing skills
export const getCourseRecommendations = (missingSkills: string[]): Record<string, string[]> => {
  const recommendations: Record<string, string[]> = {};
  
  missingSkills.forEach(skill => {
    // This is a mock function - in a real application, this would connect to a course API
    // or database to find relevant courses for each skill
    recommendations[skill] = [
      `Mastering ${skill} - Comprehensive Course`,
      `${skill} for Beginners`,
      `Advanced ${skill} Techniques`
    ];
  });
  
  return recommendations;
};
