import React from 'react';
import { Badge } from '../ui/Badge';
import { ExternalLink, Upload, AlertTriangle, Clock } from 'lucide-react';
import { Submission } from '../../types';
import { getBadgesForSubmission } from '../../data/mockData';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface SubmissionDashboardProps {
  submissions: Submission[];
}

const SubmissionDashboard: React.FC<SubmissionDashboardProps> = ({ submissions }) => {
  const navigate = useNavigate();
  
  // Check if user has submitted this month
  const today = new Date();
  const lastSubmission = submissions.length > 0 
    ? new Date(Math.max(...submissions.map(s => new Date(s.submissionDate).getTime())))
    : null;
  
  const lastApprovedOrPendingSubmission = submissions.find(s => 
    s.status === 'Approved' || s.status === 'Pending'
  );

  const hasRejectedSubmission = submissions.some(s => s.status === 'Rejected');
  
  const daysUntilNextSubmission = lastApprovedOrPendingSubmission 
    ? Math.ceil((new Date(lastApprovedOrPendingSubmission.submissionDate).getTime() + (30 * 24 * 60 * 60 * 1000) - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const canSubmit = !lastApprovedOrPendingSubmission || daysUntilNextSubmission <= 0 || hasRejectedSubmission;

  const handleSubmitClick = () => {
    navigate('/submit?member=true');
  };

  const handleResubmitClick = () => {
    navigate('/submit?member=true&resubmit=true');
  };

  return (
    <div className="space-y-6">
      {/* Monthly Submission Prompt */}
      <div className={`p-6 rounded-lg text-white ${canSubmit ? 'bg-[#9b9b6f]' : 'bg-gray-700'}`}>
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-white/10 rounded-lg">
            {canSubmit ? <Upload size={24} /> : <Clock size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {hasRejectedSubmission 
                ? "Ready to resubmit your video!"
                : canSubmit 
                  ? "Ready for your next submission!" 
                  : `Next submission available in ${daysUntilNextSubmission} days`
              }
            </h3>
            {canSubmit ? (
              <Button variant="secondary" onClick={handleSubmitClick}>
                  {hasRejectedSubmission ? "Resubmit Video" : "Submit Your Video"}
                </Button>
            ) : (
              <p className="text-sm opacity-90">
                To maintain fairness and consistency, members are limited to one submission per month. 
                Your next submission will be available on {new Date(lastSubmission!.getTime() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Existing Submissions */}
      {submissions.length > 0 ? (
        submissions.map((submission) => {
          const badges = getBadgesForSubmission(submission);
          const actualCount = submission.actualPullUpCount ?? submission.pullUpCount;
          
          return (
            <div key={submission.id} className="bg-gray-950 p-6 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    Submission from {new Date(submission.submissionDate).toLocaleDateString()}
                  </h3>
                  <p className="text-gray-400 mt-1">
                    Status: <span className={`font-medium ${
                      submission.status === 'Approved' ? 'text-green-400' :
                      submission.status === 'Rejected' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>{submission.status}</span>
                  </p>
                </div>
                <a 
                  href={submission.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9b9b6f] hover:text-[#7a7a58] flex items-center"
                >
                  <ExternalLink size={20} className="mr-1" />
                  View Video
                </a>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400">Pull-Up Count:</p>
                  <p className="text-xl font-bold text-white">{actualCount}</p>
                  {submission.actualPullUpCount !== undefined && 
                   submission.actualPullUpCount !== submission.pullUpCount && (
                    <p className="text-sm text-gray-500">
                      Originally claimed: {submission.pullUpCount}
                    </p>
                  )}
                </div>
                
                <div>
                  <p className="text-gray-400">Badges Earned:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {badges.map((badge) => (
                      <Badge 
                        key={badge.id}
                        variant={badge.id === 'elite' ? 'elite' : 'default'}
                        className={badge.id === 'elite' ? '' : 'bg-gray-800 text-white'}
                      >
                        {badge.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {submission.status === 'Rejected' && (
                <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded">
                  <p className="text-red-200 mb-3">
                    Your submission was not approved. Please review the video requirements and submit a new attempt.
                  </p>
                  <Button variant="secondary" size="sm" onClick={handleResubmitClick}>
                      Submit New Video
                    </Button>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">No submissions yet.</p>
          <button 
            onClick={handleSubmitClick}
            className="text-[#9b9b6f] hover:text-[#7a7a58] mt-2 inline-block"
          >
            Submit your first video
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmissionDashboard;