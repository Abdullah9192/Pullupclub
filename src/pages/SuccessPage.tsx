import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { Button } from '../components/ui/Button';
import { Link } from '../components/ui/Link';
import { Check } from 'lucide-react';

const SuccessPage: React.FC = () => {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isResubmission = searchParams.get('resubmit') === 'true';
  const email = localStorage.getItem('checkoutEmail');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (email) {
            navigate(`/create-account`);
          } else {
            navigate(`/submit?member=true${isResubmission ? '&resubmit=true' : ''}`);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, isResubmission, email]);

  return (
    <Layout>
      <div className="bg-gray-900 py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-8">
            <div className="rounded-full bg-[#9b9b6f] p-4">
              <Check size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
          <p className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto">
            Thank you for joining the Pull-Up Club! Your payment has been processed successfully.
            You will be redirected {email ? "to create your account" : "to the submission form"} in {countdown} seconds.
          </p>
          <Button variant="primary" size="lg">
            <Link 
              href={email ? `/create-account` : `/submit?member=true${isResubmission ? '&resubmit=true' : ''}`} 
              className="text-white"
            >
              {email ? "Create Account" : "Continue to Submission"}
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default SuccessPage;