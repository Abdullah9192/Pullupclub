import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react';
import { createCheckoutSession } from '../lib/stripe';
import { products } from '../stripe-config';

const SubscriptionPage: React.FC = () => {
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!user?.email) {
      setError('Please sign in to continue');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const checkoutUrl = await createCheckoutSession(subscriptionType, user.email);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Choose Your Plan
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Select a subscription plan to continue
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-900/50 border border-red-700 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-200">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                subscriptionType === 'monthly'
                  ? 'border-[#9b9b6f] bg-gray-800'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800'
              }`}
              onClick={() => setSubscriptionType('monthly')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id="monthly"
                  name="subscriptionType"
                  value="monthly"
                  checked={subscriptionType === 'monthly'}
                  onChange={() => setSubscriptionType('monthly')}
                  className="w-5 h-5 mr-3 text-[#9b9b6f] focus:ring-[#9b9b6f] cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="monthly" className="flex items-center justify-between cursor-pointer">
                    <span className="text-white font-medium">Monthly Subscription</span>
                    <span className="text-[#9b9b6f] font-bold">${products.pullUpClub.price}/month</span>
                  </label>
                  <p className="text-gray-400 text-sm mt-1">Perfect for month-to-month flexibility</p>
                </div>
              </div>
            </div>

            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                subscriptionType === 'annual'
                  ? 'border-[#9b9b6f] bg-gray-800'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800'
              }`}
              onClick={() => setSubscriptionType('annual')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id="annual"
                  name="subscriptionType"
                  value="annual"
                  checked={subscriptionType === 'annual'}
                  onChange={() => setSubscriptionType('annual')}
                  className="w-5 h-5 mr-3 text-[#9b9b6f] focus:ring-[#9b9b6f] cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="annual" className="flex items-center justify-between cursor-pointer">
                    <span className="text-white font-medium">Annual Subscription</span>
                    <span className="text-[#9b9b6f] font-bold">${products.pullUpClubAnnual.price}/year</span>
                  </label>
                  <p className="text-gray-400 text-sm mt-1">Save over 16% with annual billing</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center text-gray-400">
            <CreditCard size={20} className="mr-2" />
            <span className="text-sm">Secure payment powered by Stripe</span>
          </div>

          <div>
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Processing...' : `Subscribe ${subscriptionType === 'monthly' ? '($9.99/month)' : '($99.99/year)'}`}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage; 