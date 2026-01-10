import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScanHistory } from '@/components/dashboard/ScanHistory';
import { AnalysisResults } from '@/components/dashboard/AnalysisResults';
import { generateMockAnalysis, type AnalysisResult } from '@/lib/mockAnalysis';
import { FileText, Briefcase, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/login');
    return null;
  }

  // Fetch active jobs for dropdown
  const { data: jobs } = useQuery({
    queryKey: ['active-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('id, title, company, description')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Save scan mutation
  const saveScanMutation = useMutation({
    mutationFn: async (params: { resumeText: string; jdText: string; result: AnalysisResult }) => {
      const { data, error } = await supabase
        .from('scans')
        .insert({
          user_id: user!.id,
          resume_text: params.resumeText,
          jd_text: params.jdText,
          match_score: params.result.matchScore,
          analysis_json: params.result as unknown as Record<string, unknown>,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    const job = jobs?.find(j => j.id === jobId);
    if (job) {
      setJdText(`${job.title} at ${job.company}\n\n${job.description}`);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      toast.error('Please paste your resume');
      return;
    }
    if (!jdText.trim()) {
      toast.error('Please paste a job description or select a job');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = generateMockAnalysis(resumeText, jdText);
    setAnalysisResult(result);
    
    // Save the scan
    try {
      await saveScanMutation.mutateAsync({ resumeText, jdText, result });
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Failed to save scan:', error);
    }
    
    setIsAnalyzing(false);
  };

  const handleSelectScan = async (scan: { id: string; match_score: number; jd_text: string }) => {
    // Fetch full scan data
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scan.id)
      .single();
    
    if (error || !data) {
      toast.error('Failed to load scan');
      return;
    }
    
    setResumeText(data.resume_text);
    setJdText(data.jd_text);
    if (data.analysis_json) {
      setAnalysisResult(data.analysis_json as unknown as AnalysisResult);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4">
          <div className="container mx-auto">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Resume Analyzer</h1>
            <p className="text-muted-foreground mt-1">
              Optimize your resume for ATS systems and land more interviews
            </p>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            {/* Sidebar - Scan History */}
            <aside className="hidden lg:block">
              <ScanHistory onSelectScan={handleSelectScan} />
            </aside>

            {/* Main Content */}
            <main className="space-y-6">
              {/* Input Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-primary" />
                      Your Resume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Paste your resume text here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="min-h-[300px] resize-none bg-secondary/50 border-border focus:border-primary"
                    />
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Job Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {jobs && jobs.length > 0 && (
                      <Select value={selectedJobId} onValueChange={handleJobSelect}>
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue placeholder="Select from available jobs..." />
                        </SelectTrigger>
                        <SelectContent>
                          {jobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title} - {job.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Textarea
                      placeholder="Or paste job description text here..."
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      className="min-h-[250px] resize-none bg-secondary/50 border-border focus:border-primary"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Analyze Button */}
              <div className="flex justify-center">
                <Button
                  variant="hero"
                  size="xl"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="min-w-[200px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Analyze Fit
                    </>
                  )}
                </Button>
              </div>

              {/* Loading Skeleton */}
              {isAnalyzing && (
                <div className="space-y-6">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                  </div>
                </div>
              )}

              {/* Results */}
              {analysisResult && !isAnalyzing && (
                <AnalysisResults
                  result={analysisResult}
                  onApply={(company) => toast.success(`Applied to ${company}!`)}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
