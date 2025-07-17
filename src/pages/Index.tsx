
import React, { useState } from 'react';
import Header from '@/components/header/Header';
import HeroSection from '@/components/HeroSection';
import JobRolesCarousel from '@/components/JobRolesCarousel';
import TopEmployers from '@/components/TopEmployers';
import JobDiscovery from '@/components/JobDiscovery';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [showJobDiscovery, setShowJobDiscovery] = useState(false);

  if (showJobDiscovery) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <JobDiscovery />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <JobRolesCarousel />
        <TopEmployers />
        
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Ready to Find Your Next Job?</h2>
            <Button 
              onClick={() => setShowJobDiscovery(true)}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              Start Job Discovery
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
