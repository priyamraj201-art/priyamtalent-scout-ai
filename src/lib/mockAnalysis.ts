export interface AnalysisResult {
  matchScore: number;
  missingKeywords: string[];
  profileSummary: string;
  companyFit: { name: string; type: string }[];
  improvementTips: string[];
}

// Mock analysis function that simulates AI processing
export function generateMockAnalysis(resumeText: string, jdText: string): AnalysisResult {
  // Simulated keyword extraction
  const techKeywords = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'PostgreSQL', 'MongoDB', 'CI/CD', 'Agile', 'Git', 'TDD'];
  const softSkills = ['Leadership', 'Communication', 'Problem-solving', 'Team collaboration', 'Project management'];
  
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jdText.toLowerCase();
  
  // Find keywords in JD that are missing from resume
  const allKeywords = [...techKeywords, ...softSkills];
  const jdKeywords = allKeywords.filter(k => jdLower.includes(k.toLowerCase()));
  const missingKeywords = jdKeywords.filter(k => !resumeLower.includes(k.toLowerCase()));
  
  // Calculate a mock score based on keyword matching
  const matchedCount = jdKeywords.length - missingKeywords.length;
  const baseScore = jdKeywords.length > 0 ? (matchedCount / jdKeywords.length) * 100 : 70;
  const randomVariance = Math.random() * 15 - 7.5;
  const matchScore = Math.min(100, Math.max(20, Math.round(baseScore + randomVariance)));
  
  // Detect company type preferences based on resume content
  const prefersStartup = resumeLower.includes('startup') || resumeLower.includes('agile') || resumeLower.includes('fast-paced');
  const prefersMNC = resumeLower.includes('enterprise') || resumeLower.includes('corporate') || resumeLower.includes('large-scale');
  
  // Generate company recommendations
  const startupCompanies = [
    { name: 'TechStartup Inc', type: 'Startup' },
    { name: 'InnovateCo', type: 'Startup' },
    { name: 'DisruptLabs', type: 'Startup' },
  ];
  
  const mncCompanies = [
    { name: 'GlobalTech Corp', type: 'MNC' },
    { name: 'Enterprise Solutions Ltd', type: 'MNC' },
    { name: 'MegaCorp Industries', type: 'MNC' },
  ];
  
  let companyFit;
  if (prefersStartup && !prefersMNC) {
    companyFit = startupCompanies;
  } else if (prefersMNC && !prefersStartup) {
    companyFit = mncCompanies;
  } else {
    companyFit = [startupCompanies[0], mncCompanies[0], startupCompanies[1]];
  }
  
  // Generate profile summary
  const profileSummaries = [
    "A results-driven professional with a strong technical background and proven ability to deliver high-quality solutions. Your experience demonstrates adaptability and continuous learning.",
    "An innovative technologist with hands-on experience in modern development practices. Your profile shows a commitment to excellence and collaborative problem-solving.",
    "A dedicated professional with diverse technical skills and a track record of successful project delivery. Your background indicates strong analytical and communication abilities.",
  ];
  
  const profileSummary = profileSummaries[Math.floor(Math.random() * profileSummaries.length)];
  
  // Generate improvement tips
  const allTips = [
    "Add quantifiable achievements with specific metrics (e.g., 'Improved performance by 40%')",
    "Include more industry-specific keywords from the job description",
    "Highlight leadership experience or team collaboration examples",
    "Add relevant certifications or continuous learning activities",
    "Tailor your professional summary to match the role requirements",
    "Include specific technology versions and tools you've worked with",
    "Add links to portfolio, GitHub, or professional profiles",
    "Emphasize problem-solving examples with measurable outcomes",
  ];
  
  // Select 3 random tips
  const shuffled = allTips.sort(() => 0.5 - Math.random());
  const improvementTips = shuffled.slice(0, 3);
  
  return {
    matchScore,
    missingKeywords: missingKeywords.slice(0, 6), // Limit to 6 keywords
    profileSummary,
    companyFit,
    improvementTips,
  };
}
