import React, { useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../context/AuthContext';
import { clubs, regions } from '../../data/mockData';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Form state interface
interface FormState {
  step: number;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  region: string;
  clubAffiliation: string;
  otherClubAffiliation: string;
  pullUpCount: number;
  videoLink: string;
  videoConfirmed: boolean;
  videoAuthenticity: boolean;
  isSubmitting: boolean;
  errorMessage: string;
}

// Gender options
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

// Initial form state
const initialFormState: FormState = {
  step: 1,
  fullName: '',
  email: '',
  phone: '',
  age: 16,
  gender: 'male',
  region: '',
  clubAffiliation: '',
  otherClubAffiliation: '',
  pullUpCount: 0,
  videoLink: '',
  videoConfirmed: false,
  videoAuthenticity: false,
  isSubmitting: false,
  errorMessage: '',
};

// Form reducer
type FormAction =
  | { type: 'UPDATE_FIELD'; field: string; value: any }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'RESET_FORM' };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: state.step - 1 };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.value };
    case 'SET_ERROR':
      return { ...state, errorMessage: action.message };
    case 'RESET_FORM':
      return initialFormState;
    default:
      return state;
  }
};

const SubmissionForm: React.FC = () => {
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Add check for last submission
  const checkLastSubmission = async () => {
    try {
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (submissions && submissions.length > 0) {
        const lastSubmission = new Date(submissions[0].created_at);
        const now = new Date();
        const daysSinceLastSubmission = Math.floor((now.getTime() - lastSubmission.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastSubmission < 30) {
          const daysRemaining = 30 - daysSinceLastSubmission;
          throw new Error(`You can submit again in ${daysRemaining} days. Please wait until ${new Date(lastSubmission.getTime() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}`);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      dispatch({ type: 'UPDATE_FIELD', field: name, value: checked });
    } else if (name === 'videoLink') {
      let validatedUrl = value;
      if (value && !value.match(/^https?:\/\//)) {
        validatedUrl = `https://${value}`;
      }
      dispatch({ type: 'UPDATE_FIELD', field: name, value: validatedUrl });
    } else if (name === 'email') {
      dispatch({ type: 'UPDATE_FIELD', field: name, value });
      setEmailError('');
    } else {
      dispatch({ type: 'UPDATE_FIELD', field: name, value });
    }
  };

  const validateEmail = () => {
    if (!formState.email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.step === 1 && !validateEmail()) {
      return;
    }
    dispatch({ type: 'NEXT_STEP' });
  };

  const handlePrevStep = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) {
      return;
    }

    try {
      dispatch({ type: 'SET_SUBMITTING', value: true });
      
      // Check for 30-day restriction
      await checkLastSubmission();

      // If "Other" is selected, use the otherClubAffiliation value
      const finalClubAffiliation = formState.clubAffiliation === 'Other' 
        ? formState.otherClubAffiliation 
        : formState.clubAffiliation;
      
      // Update user profile if it exists, create if it doesn't
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          is_profile_completed: true,
          full_name: formState.fullName,
          email: formState.email,
          age: formState.age,
          gender: formState.gender,
          region: formState.region,
          club_affiliation: finalClubAffiliation,
          street_address: '',
          city: '',
          state: '',
          zip_code: '',
          country: '',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .select();

      // If update fails because profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user?.id,
            is_profile_completed: true,
            full_name: formState.fullName,
            email: formState.email,
            age: formState.age,
            gender: formState.gender,
            region: formState.region,
            club_affiliation: finalClubAffiliation,
            street_address: '',
            city: '',
            state: '',
            zip_code: '',
            country: ''
          });

        if (insertError) {
          console.error('Profile creation error:', insertError);
          throw insertError;
        }
      } else if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Then create the submission with all fields
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert([
          {
            user_id: user?.id,
            full_name: formState.fullName,
            email: formState.email,
            pull_up_count: parseInt(formState.pullUpCount.toString()),
            video_url: formState.videoLink,
            status: 'pending',
            age: formState.age,
            gender: formState.gender,
            region: formState.region,
            club_affiliation: finalClubAffiliation
          }
        ]);

      if (submissionError) {
        console.error('Submission error:', submissionError);
        throw submissionError;
      }

      // Redirect to profile page
      navigate('/profile');
    } catch (err) {
      console.error('Error submitting:', err);
      dispatch({ 
        type: 'SET_ERROR', 
        message: err instanceof Error ? err.message : 'Failed to submit video' 
      });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  };

  const validateStep = () => {
    switch (formState.step) {
      case 1:
        return !formState.fullName || 
               !formState.email || 
               !formState.age || 
               !formState.region || 
               !formState.email.includes('@') ||
               (formState.clubAffiliation === 'Other' && !formState.otherClubAffiliation);
      case 2:
        return !formState.pullUpCount || 
               !formState.videoLink || 
               !formState.videoLink.match(/^https?:\/\//) || 
               !formState.videoConfirmed || 
               !formState.videoAuthenticity;
      default:
        return false;
    }
  };

  if (formSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-500 p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Thank You for Your Submission!</h2>
          <p className="text-gray-300 mb-6">
            Your video is being reviewed by our team. You'll be notified once a decision has been made. Good luck!
          </p>
          <Button 
            onClick={() => navigate('/profile')}
            variant="primary"
            size="lg"
          >
            Return to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Progress Steps */}
        <div className="bg-gray-700 px-6 py-4">
          <div className="flex justify-between">
            <div className={`flex items-center ${formState.step >= 1 ? 'text-[#9b9b6f]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                formState.step >= 1 ? 'border-[#9b9b6f]' : 'border-gray-400'
              }`}>
                1
              </div>
              <span className="ml-2">Personal Information</span>
            </div>
            <div className={`flex items-center ${formState.step >= 2 ? 'text-[#9b9b6f]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                formState.step >= 2 ? 'border-[#9b9b6f]' : 'border-gray-400'
              }`}>
                2
              </div>
              <span className="ml-2">Performance Details</span>
            </div>
          </div>
        </div>
      
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            {formState.step === 1 ? 'Personal Information' : 'Performance Details'}
          </h2>

          {formState.errorMessage && (
            <div className="bg-red-900 border border-red-700 text-white p-4 rounded-lg mb-6 flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              <span>{formState.errorMessage}</span>
            </div>
          )}
          
          <form onSubmit={formState.step === 2 ? handleSubmit : handleNextStep}>
            {formState.step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-white mb-1">
                    Full Name <span className="text-[#9b9b6f]">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formState.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-white mb-1">
                    Email <span className="text-[#9b9b6f]">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                    required
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-400">{emailError}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-white mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formState.phone}
                    onChange={handleChange}
                    placeholder="(optional)"
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                  />
                </div>
                
                  <div>
                    <label htmlFor="age" className="block text-white mb-1">
                      Age <span className="text-[#9b9b6f]">*</span>
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      min="16"
                      max="100"
                    value={formState.age}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="gender" className="block text-white mb-1">
                      Gender <span className="text-[#9b9b6f]">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formState.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                      required
                    >
                      {GENDER_OPTIONS.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-700 text-white">
                          {option.label}
                        </option>
                      ))}
                    </select>
                </div>

                <div>
                  <label htmlFor="region" className="block text-white mb-1">
                    Region <span className="text-[#9b9b6f]">*</span>
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={formState.region}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                    required
                  >
                    <option value="">Select your region</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="clubAffiliation" className="block text-white mb-1">
                    Club Affiliation
                  </label>
                  <select
                    id="clubAffiliation"
                    name="clubAffiliation"
                    value={formState.clubAffiliation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                  >
                    <option value="">Select a club (optional)</option>
                    {clubs.map((club) => (
                      <option key={club} value={club}>
                        {club}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                  
                  {formState.clubAffiliation === 'Other' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        id="otherClubAffiliation"
                        name="otherClubAffiliation"
                        value={formState.otherClubAffiliation}
                        onChange={handleChange}
                        placeholder="Enter your club name"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {formState.step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="pullUpCount" className="block text-white mb-1">
                    Pull-Up Count <span className="text-[#9b9b6f]">*</span>
                  </label>
                  <input
                    type="number"
                    id="pullUpCount"
                    name="pullUpCount"
                    min="1"
                    max="100"
                    value={formState.pullUpCount || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="videoLink" className="block text-white mb-1">
                    Video Link <span className="text-[#9b9b6f]">*</span>
                  </label>
                  <input
                    type="url"
                    id="videoLink"
                    name="videoLink"
                    value={formState.videoLink}
                    onChange={handleChange}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-400">
                    Please upload your video to YouTube, Instagram, or TikTok and paste the public link here.
                  </p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-white mb-2">Video Requirements</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                    <li>Clear, unobstructed view of the full movement</li>
                    <li>Chin must clear the bar for each rep</li>
                    <li>Full arm extension at the bottom of each rep</li>
                    <li>Continuous recording without cuts or edits</li>
                    <li>Video must be publicly accessible</li>
                  </ul>
                </div>

                <div className="flex items-start mt-4">
                  <input
                    type="checkbox"
                    id="videoConfirmed"
                    name="videoConfirmed"
                    checked={formState.videoConfirmed}
                    onChange={handleChange}
                    className="w-5 h-5 mt-1 mr-3 rounded border-gray-300 text-[#9b9b6f] focus:ring-[#9b9b6f] cursor-pointer"
                    required
                  />
                  <label htmlFor="videoConfirmed" className="text-gray-300 text-sm">
                    I confirm that the video link I have provided is correct and publicly accessible.
                    <span className="text-[#9b9b6f]">*</span>
                  </label>
                </div>

                <div className="flex items-start mt-4">
                  <input
                    type="checkbox"
                    id="videoAuthenticity"
                    name="videoAuthenticity"
                    checked={formState.videoAuthenticity}
                    onChange={handleChange}
                    className="w-5 h-5 mt-1 mr-3 rounded border-gray-300 text-[#9b9b6f] focus:ring-[#9b9b6f] cursor-pointer"
                    required
                  />
                  <label htmlFor="videoAuthenticity" className="text-gray-300 text-sm">
                    I confirm this is an authentic video of my performance.
                    <span className="text-[#9b9b6f]">*</span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex justify-between">
              {formState.step > 1 && (
                <Button
                  onClick={handlePrevStep}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                >
                  Back
                </Button>
              )}
              
              {formState.step < 2 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={validateStep()}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={validateStep() || formState.isSubmitting}
                  isLoading={formState.isSubmitting}
                >
                  Submit Video
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmissionForm;