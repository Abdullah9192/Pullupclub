import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import SubmissionDashboard from '../components/Profile/SubmissionDashboard';
import PatchProgress from '../components/Profile/PatchProgress';
import RankingsTab from '../components/Profile/RankingsTab';
import SubscriptionStatus from '../components/Profile/SubscriptionStatus';
import { mockSubmissions, getBadgesForSubmission } from '../data/mockData';
import { createClient } from '@supabase/supabase-js';
import { AlertTriangle } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ProfilePage: React.FC = () => {
  const { user, signOut, isFirstLogin, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'submissions' | 'rankings' | 'personal'>('submissions');
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    socialMedia: '',
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isFirstLogin) {
      setActiveTab('personal');
    }
  }, [isFirstLogin]);

  useEffect(() => {
    if (profile) {
      setFormData({
        socialMedia: profile.socialMedia || '',
        streetAddress: profile.streetAddress || '',
        apartment: profile.apartment || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        country: profile.country || ''
      });
    }
  }, [profile]);

  const userSubmissions = mockSubmissions.filter(sub => sub.email === user?.email);
  const mockBillingHistory = [
    {
      id: '1',
      date: '2025-03-01',
      amount: '$10.00',
      status: 'Paid',
      description: 'Monthly Subscription'
    },
    {
      id: '2',
      date: '2025-02-01',
      amount: '$10.00',
      status: 'Paid',
      description: 'Monthly Subscription'
    }
  ];

  const highestSubmission = userSubmissions.reduce((highest, current) => {
    const currentCount = current.actualPullUpCount ?? current.pullUpCount;
    const highestCount = highest ? (highest.actualPullUpCount ?? highest.pullUpCount) : 0;
    return currentCount > highestCount ? current : highest;
  }, null);

  const userBadges = highestSubmission ? getBadgesForSubmission(highestSubmission) : [];
  const eliteBadge = userBadges.find(badge => badge.id === 'elite');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateSocialMedia = (value: string) => {
    return value.trim() !== '';
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    if (!validateSocialMedia(formData.socialMedia)) {
      setError('Social media handle is required');
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          social_media: formData.socialMedia,
          street_address: formData.streetAddress,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          country: formData.country,
          is_profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      if (isFirstLogin) {
        setActiveTab('submissions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setIsDeactivating(true);
      
      // Update user profile to mark as deactivated
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      // Sign out the user
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deactivating account:', error);
      alert('Failed to deactivate account. Please try again.');
    } finally {
      setIsDeactivating(false);
      setShowDeactivateConfirm(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <div className="bg-black min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Profile</h2>
                <p className="text-gray-400 mt-1">{user.email}</p>
              </div>
              {eliteBadge && (
                <Badge variant="elite" className="text-sm">
                  {eliteBadge.name}
                </Badge>
              )}
            </div>

            {isFirstLogin && activeTab !== 'personal' && (
              <div className="p-4 bg-[#9b9b6f] bg-opacity-20 border-l-4 border-[#9b9b6f]">
                <p className="text-white">
                  Welcome to Pull-Up Club! Please complete your profile information to receive your welcome package.
                </p>
                <Button
                  onClick={() => setActiveTab('personal')}
                  className="mt-2"
                >
                  Complete Profile
                </Button>
              </div>
            )}

            <div className="p-6 border-b border-gray-800">
              <SubscriptionStatus />
            </div>

            <div className="p-6 border-b border-gray-800">
              <PatchProgress />
            </div>

            <div className="border-b border-gray-800">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('submissions')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'submissions'
                      ? 'text-white border-b-2 border-[#9b9b6f]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Submissions
                </button>
                <button
                  onClick={() => setActiveTab('rankings')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'rankings'
                      ? 'text-white border-b-2 border-[#9b9b6f]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Rankings
                </button>
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'personal'
                      ? 'text-white border-b-2 border-[#9b9b6f]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'submissions' && (
                <SubmissionDashboard submissions={userSubmissions} />
              )}
              {activeTab === 'rankings' && (
                <RankingsTab userEmail={user.email} />
              )}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  {error && (
                    <div className="bg-red-900 border border-red-700 text-white p-4 rounded-lg flex items-center">
                      <AlertTriangle size={20} className="mr-2" />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  <form onSubmit={handleSavePersonalInfo} className="space-y-6">
                    <div className="bg-gray-950 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-white mb-4">Social Media</h3>
                      <div>
                        <label htmlFor="socialMedia" className="block text-sm font-medium text-gray-400">
                          Social Media Handle <span className="text-[#9b9b6f]">*</span>
                        </label>
                        <input
                          type="text"
                          id="socialMedia"
                          name="socialMedia"
                          value={formData.socialMedia}
                          onChange={handleInputChange}
                          placeholder="@yourusername"
                          className="mt-1 block w-full rounded-md bg-gray-900 border border-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:border-transparent"
                          required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          This will be displayed on the leaderboard
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-950 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-white mb-4">Shipping Address</h3>
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-400">
                            Street Address <span className="text-[#9b9b6f]">*</span>
                          </label>
                          <input
                            type="text"
                            id="streetAddress"
                            name="streetAddress"
                            value={formData.streetAddress}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md bg-gray-900 border border-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label htmlFor="apartment" className="block text-sm font-medium text-gray-400">
                            Apartment/Suite/Unit <span className="text-gray-600">(optional)</span>
                          </label>
                          <input
                            type="text"
                            id="apartment"
                            name="apartment"
                            value={formData.apartment}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md bg-gray-900 border border-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-400">
                              City <span className="text-[#9b9b6f]">*</span>
                            </label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              required
                              className="mt-1 block w-full rounded-md bg-gray-900 border border-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-400">
                              State/Province <span className="text-[#9b9b6f]">*</span>
                            </label>
                            <input
                              type="text"
                              id="state"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              required
                              className="mt-1 block w-full rounded-md bg-gray-900 border border-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-400">
                              ZIP/Postal Code <span className="text-[#9b9b6f]">*</span>
                            </label>
                            <input
                              type="text"
                              id="zipCode"
                              name="zipCode"
                              value={formData.zipCode}
                              onChange={handleInputChange}
                              required
                              className="mt-1 block w-full rounded-md bg-gray-900 border border-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-400">
                              Country <span className="text-[#9b9b6f]">*</span>
                            </label>
                            <input
                              type="text"
                              id="country"
                              name="country"
                              value={formData.country}
                              onChange={handleInputChange}
                              required
                              className="mt-1 block w-full rounded-md bg-gray-900 border border-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-950 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-white mb-4">Billing History</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {mockBillingHistory.map((payment) => (
                              <tr key={payment.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {new Date(payment.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {payment.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {payment.amount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {payment.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-gray-950 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-white mb-4">Account Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="border-t border-gray-800 pt-4">
                          <h4 className="text-red-500 font-medium mb-2">Danger Zone</h4>
                          <p className="text-gray-400 text-sm mb-4">
                            Deactivating your account will hide your profile and submissions from other users.
                            You can reactivate your account at any time by logging in again.
                          </p>
                          
                          {showDeactivateConfirm ? (
                            <div className="bg-gray-900 p-4 rounded-lg border border-red-500">
                              <p className="text-white mb-4">
                                Are you sure you want to deactivate your account? This will hide your profile and submissions from other users.
                                You can reactivate your account at any time by logging in again.
                              </p>
                              <div className="flex space-x-4">
                                <Button
                                  variant="danger"
                                  onClick={handleDeactivateAccount}
                                  isLoading={isDeactivating}
                                >
                                  Yes, Deactivate My Account
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowDeactivateConfirm(false)}
                                  disabled={isDeactivating}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="danger"
                              onClick={() => setShowDeactivateConfirm(true)}
                            >
                              Deactivate Account
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        isLoading={isSaving}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-950 border-t border-gray-800">
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  onClick={() => {
                    signOut();
                    navigate('/');
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;