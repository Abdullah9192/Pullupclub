import React from 'react';
import Layout from '../components/Layout/Layout';
import SubmissionForm from '../components/Submission/SubmissionForm';
import { Link } from '../components/ui/Link';
import CountdownTimer from '../components/Home/CountdownTimer';

const SubmissionPage: React.FC = () => {
  return (
    <Layout>
      <div className="bg-black py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Submit Your Pull-Up Challenge</h1>
            <p className="mt-2 text-gray-400">
              Show off your strength and join the leaderboard! 
              Your submission will be reviewed by our team.
              Please review our <Link href="/rules" className="text-[#9b9b6f] hover:text-[#7a7a58]">competition rules</Link> before submitting.
            </p>
            <img 
              src="https://cdn.shopify.com/s/files/1/0567/5237/3945/files/Green_BB_PUC_LOGO.png?v=1746304578"
              alt="Pull-Up Club Logo"
              className="mx-auto mt-6 h-32 w-auto"
            />
            <div className="mt-6 max-w-2xl mx-auto">
              <CountdownTimer />
            </div>
          </div>
          
          <SubmissionForm />
        </div>
      </div>
    </Layout>
  );
};

export default SubmissionPage;