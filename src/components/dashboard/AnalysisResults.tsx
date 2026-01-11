import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreRing } from './ScoreRing';
import { CheckCircle2, XCircle, Lightbulb, Building2, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisResult {
  matchScore: number;
  missingKeywords: string[];
  profileSummary: string;
  companyFit: { name: string; type: string }[];
  improvementTips: string[];
}

interface AnalysisResultsProps {
  result: AnalysisResult;
  onApply?: (company: string) => void;
}

const openLinkedInJobSearch = (companyName: string) => {
  const searchQuery = encodeURIComponent(`${companyName} jobs`);
  const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;
  window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
  toast.success(`Opening LinkedIn jobs for ${companyName}`);
};

export function AnalysisResults({ result, onApply }: AnalysisResultsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Score Section */}
      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ScoreRing score={result.matchScore} size="lg" />
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-display text-2xl font-bold mb-2">
                  {result.matchScore >= 80
                    ? 'Excellent Match! 🎉'
                    : result.matchScore >= 60
                    ? 'Good Fit!'
                    : result.matchScore >= 40
                    ? 'Moderate Match'
                    : 'Needs Improvement'}
                </h3>
                <p className="text-muted-foreground">
                  {result.matchScore >= 80
                    ? "Your resume is highly optimized for this role. You're ready to apply!"
                    : result.matchScore >= 60
                    ? 'A few tweaks could make your application even stronger.'
                    : 'Consider adding the missing keywords and skills below.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Missing Keywords */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <XCircle className="h-5 w-5 text-destructive" />
              Missing Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.missingKeywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/30"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Summary */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
              "{result.profileSummary}"
            </blockquote>
          </CardContent>
        </Card>
      </motion.div>

      {/* Company Fit */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Recommended Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              {result.companyFit.map((company, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{company.name}</span>
                    <Badge
                      variant="secondary"
                      className={
                        company.type === 'Startup'
                          ? 'bg-success/20 text-success border-success/30'
                          : ''
                      }
                    >
                      {company.type}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-2 hover:text-primary"
                    onClick={() => openLinkedInJobSearch(company.name)}
                  >
                    <Linkedin className="h-4 w-4" />
                    Apply on LinkedIn
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Improvement Tips */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-warning" />
              Improvement Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.improvementTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-warning">{index + 1}</span>
                  </div>
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
