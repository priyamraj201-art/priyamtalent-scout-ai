import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Scan {
  id: string;
  match_score: number;
  created_at: string;
  jd_text: string;
}

interface ScanHistoryProps {
  onSelectScan: (scan: Scan) => void;
  selectedId?: string;
}

export function ScanHistory({ onSelectScan, selectedId }: ScanHistoryProps) {
  const { user } = useAuth();

  const { data: scans, isLoading } = useQuery({
    queryKey: ['scans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('scans')
        .select('id, match_score, created_at, jd_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Scan[];
    },
    enabled: !!user,
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/20';
    if (score >= 60) return 'text-primary bg-primary/20';
    if (score >= 40) return 'text-warning bg-warning/20';
    return 'text-destructive bg-destructive/20';
  };

  const extractJobTitle = (jdText: string) => {
    const firstLine = jdText.split('\n')[0];
    return firstLine.length > 40 ? firstLine.slice(0, 40) + '...' : firstLine || 'Job Analysis';
  };

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Scan History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : scans && scans.length > 0 ? (
            <div className="p-2 space-y-1">
              {scans.map((scan) => (
                <button
                  key={scan.id}
                  onClick={() => onSelectScan(scan)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-secondary/80 group',
                    selectedId === scan.id && 'bg-secondary border border-primary/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {extractJobTitle(scan.jd_text)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(scan.created_at), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-xs font-bold px-2 py-1 rounded-full',
                          getScoreColor(scan.match_score)
                        )}
                      >
                        {scan.match_score}%
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No scans yet. Analyze your first resume!
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
