import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/landing/Hero';
import { LatestJobs } from '@/components/landing/LatestJobs';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <LatestJobs />
      
      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 TalentScout AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
