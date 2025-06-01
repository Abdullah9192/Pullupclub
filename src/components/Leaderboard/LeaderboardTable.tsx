import React, { useState } from 'react';
import { Submission, LeaderboardFilters } from '../../types';
import { Badge } from '../ui/Badge';
import { getBadgesForSubmission } from '../../data/mockData';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface LeaderboardTableProps {
  submissions: Submission[];
  filters: LeaderboardFilters;
}

interface GroupedSubmissions {
  [key: number]: Submission[];
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ submissions, filters }) => {
  const [expandedGroups, setExpandedGroups] = useState<{[key: number]: boolean}>({});
  
  const highestSubmissions = submissions.reduce((acc: Submission[], curr) => {
    const existingSubmission = acc.find(s => s.email === curr.email);
    if (!existingSubmission) {
      acc.push(curr);
    } else {
      const existingCount = existingSubmission.actualPullUpCount ?? existingSubmission.pullUpCount;
      const currentCount = curr.actualPullUpCount ?? curr.pullUpCount;
      if (currentCount > existingCount) {
        const index = acc.indexOf(existingSubmission);
        acc[index] = curr;
      }
    }
    return acc;
  }, []);

  const filteredSubmissions = highestSubmissions.filter(submission => {
    if (filters.club && submission.clubAffiliation !== filters.club) return false;
    
    if (filters.gender && submission.gender !== filters.gender) return false;
    
    if (filters.region && submission.region !== filters.region) return false;
    
    if (filters.ageGroup) {
      const ageGroups = {
        'Under 18': [0, 17],
        '18-24': [18, 24],
        '25-29': [25, 29],
        '30-39': [30, 39],
        '40-49': [40, 49],
        '50+': [50, 200]
      };
      
      const [min, max] = ageGroups[filters.ageGroup as keyof typeof ageGroups];
      if (submission.age < min || submission.age > max) return false;
    }
    
    if (filters.badge) {
      const userBadges = getBadgesForSubmission(submission);
      if (!userBadges.some(badge => badge.id === filters.badge)) return false;
    }
    
    return true;
  });
  
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    const aCount = a.actualPullUpCount ?? a.pullUpCount;
    const bCount = b.actualPullUpCount ?? b.pullUpCount;
    
    if (bCount !== aCount) {
      return bCount - aCount;
    }
    return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
  });
  
  const groupedSubmissions: GroupedSubmissions = sortedSubmissions.reduce((acc, submission) => {
    const count = submission.actualPullUpCount ?? submission.pullUpCount;
    if (!acc[count]) {
      acc[count] = [];
    }
    acc[count].push(submission);
    return acc;
  }, {} as GroupedSubmissions);
  
  const groupsArray = Object.entries(groupedSubmissions)
    .map(([pullUpCount, submissions]) => ({
      pullUpCount: Number(pullUpCount),
      submissions,
    }))
    .sort((a, b) => b.pullUpCount - a.pullUpCount);
  
  const toggleGroup = (pullUpCount: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [pullUpCount]: !prev[pullUpCount]
    }));
  };

  if (sortedSubmissions.length === 0) {
    return (
      <div className="bg-gray-900 p-8 rounded-lg text-center">
        <h3 className="text-white text-xl mb-2">No matching submissions found</h3>
        <p className="text-gray-400">Try adjusting your filters or check back later for new submissions.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-950 text-gray-400 text-left text-sm uppercase">
              <th className="px-6 py-3">Rank</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Region</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3">Pull-Ups</th>
              <th className="px-6 py-3">Badges</th>
              <th className="px-6 py-3">Social</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
            {groupsArray.map((group, groupIndex) => {
              const isExpanded = expandedGroups[group.pullUpCount];
              const showSubmissions = group.submissions.length === 1 || isExpanded;
              const currentRank = groupsArray.slice(0, groupIndex)
                .reduce((sum, g) => sum + g.submissions.length, 0) + 1;
              
              return (
                <React.Fragment key={group.pullUpCount}>
                  {group.submissions.length > 1 && (
                    <tr 
                      className="bg-gray-950 cursor-pointer hover:bg-gray-900 transition-colors"
                      onClick={() => toggleGroup(group.pullUpCount)}
                    >
                      <td colSpan={7} className="px-6 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="font-bold text-[#9b9b6f] mr-2">
                              {currentRank}-{currentRank + group.submissions.length - 1}
                            </span>
                            <span className="text-white">
                              {group.submissions.length} athletes with {group.pullUpCount} pull-ups
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={20} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {showSubmissions && group.submissions.map((submission, index) => {
                    const badges = getBadgesForSubmission(submission);
                    const rank = group.submissions.length > 1 
                      ? currentRank + index 
                      : currentRank;
                    
                    return (
                      <tr key={submission.id} className="bg-gray-900 hover:bg-gray-950 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-[#9b9b6f]">{rank}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-white font-medium">{submission.fullName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-300">{submission.region}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-gray-400">
                              {submission.clubAffiliation || 'No Club'}
                            </div>
                            <div className="text-gray-500">
                              {submission.age} years • {submission.gender}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xl font-bold text-white">
                            {submission.actualPullUpCount ?? submission.pullUpCount}
                          </div>
                          {submission.actualPullUpCount !== undefined && submission.actualPullUpCount !== submission.pullUpCount && (
                            <div className="text-sm text-gray-400">
                              Claimed: {submission.pullUpCount}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            {badges.map((badge) => (
                              <img
                                key={badge.id}
                                src={badge.imageUrl}
                                alt={badge.name}
                                title={badge.name}
                                className="h-20 w-20 rounded-full object-cover"
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.socialHandle ? (
                            <a 
                              href={`https://instagram.com/${submission.socialHandle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#9b9b6f] hover:text-[#7a7a58] flex items-center"
                            >
                              @{submission.socialHandle}
                            </a>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;