import React from 'react';
import Layout from '../components/Layout/Layout';
import Hero from '../components/Home/Hero';
import HowItWorks from '../components/Home/HowItWorks';
import PerksSection from '../components/Home/PerksSection';
import LeaderboardPreview from '../components/Home/LeaderboardPreview';
import TestimonialSection from '../components/Home/TestimonialSection';
import CTASection from '../components/Home/CTASection';

const Home: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <HowItWorks />
      <PerksSection />
      <LeaderboardPreview />
      <TestimonialSection />
      <CTASection />
    </Layout>
  );
};

export default Home;