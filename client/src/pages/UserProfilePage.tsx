import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Globe,
  Github,
  Calendar,
  UserPlus,
  UserMinus,
  BookOpen,
  Star,
  Download,
  MessageCircle,
  Users,
  Heart
} from 'lucide-react';

import { profileApi, workflowApi, communityApi, type User as UserType, type Workflow } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';
import { formatDate, formatRelativeTime, generateAvatarUrl, truncateText } from '../lib/utils';

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'workflows' | 'followers' | 'following'>('workflows');

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['user-profile', username],
    queryFn: () => profileApi.getPublicProfile(username!),
    enabled: !!username,
  });

  // Fetch user's public workflows
  const { data: userWorkflows } = useQuery({
    queryKey: ['user-workflows', username],
    queryFn: () => workflowApi.getByUser({ username: username! }),
    enabled: !!username,
  });

  // Fetch followers
  const { data: followersData } = useQuery({
    queryKey: ['user-followers', userProfile?.id],
    queryFn: () => communityApi.getFollowers(userProfile!.id),
    enabled: !!userProfile?.id,
  });

  // Fetch following
  const { data: followingData } = useQuery({
    queryKey: ['user-following', userProfile?.id],
    queryFn: () => communityApi.getFollowing(userProfile!.id),
    enabled: !!userProfile?.id,
  });

  // Check if current user is following this user
  const isFollowing = followingData?.users?.some((u: UserType) => u.id === currentUser?.id) || false;

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: (action: 'follow' | 'unfollow') =>
      action === 'follow'
        ? communityApi.followUser(userProfile!.id)
        : communityApi.unfollowUser(userProfile!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-followers', userProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-following', currentUser?.id] });
      toast.success(isFollowing ? 'Unfollowed user' : 'Following user');
    },
    onError: () => {
      toast.error('Failed to update follow status');
    },
  });

  const handleFollow = () => {
    if (!isAuthenticated) {
      toast.warning('Please login to follow users');
      return;
    }
    if (currentUser?.id === userProfile?.id) {
      toast.warning('You cannot follow yourself');
      return;
    }
    followMutation.mutate(isFollowing ? 'unfollow' : 'follow');
  };

  const workflows = userWorkflows?.workflows || [];
  const followers = followersData?.users || [];
  const following = followingData?.users || [];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card p-6 animate-pulse">
            <div className="h-8 bg-secondary-200 rounded mb-4"></div>
            <div className="h-4 bg-secondary-200 rounded mb-2"></div>
            <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-900">User Not Found</h2>
          <p className="mt-2 text-secondary-600">The user you're looking for doesn't exist.</p>
          <Link to="/workflows" className="btn-primary mt-4">
            Browse Workflows
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userProfile.id;

  return (
    <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Profile Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <img
                src={userProfile.profile_image_url || generateAvatarUrl(userProfile.username)}
                alt={userProfile.username}
                className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-secondary-900">
                    {userProfile.first_name && userProfile.last_name
                      ? `${userProfile.first_name} ${userProfile.last_name}`
                      : userProfile.username}
                  </h1>
                  {userProfile.first_name && userProfile.last_name && (
                    <span className="text-lg text-secondary-500">@{userProfile.username}</span>
                  )}
                </div>

                {userProfile.bio && (
                  <p className="text-lg text-secondary-600 mb-4">{userProfile.bio}</p>
                )}

                {/* User metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {formatDate(userProfile.created_at)}
                  </div>
                  {userProfile.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {userProfile.location}
                    </div>
                  )}
                  {userProfile.website && (
                    <a
                      href={userProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-primary-600"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Website
                    </a>
                  )}
                  {userProfile.github_username && (
                    <a
                      href={`https://github.com/${userProfile.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-primary-600"
                    >
                      <Github className="h-4 w-4 mr-1" />
                      GitHub
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6 mt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-secondary-900">{workflows.length}</div>
                    <div className="text-sm text-secondary-500">Workflows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-secondary-900">{followers.length}</div>
                    <div className="text-sm text-secondary-500">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-secondary-900">{following.length}</div>
                    <div className="text-sm text-secondary-500">Following</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              {isOwnProfile ? (
                <Link to="/profile" className="btn-secondary">
                  Edit Profile
                </Link>
              ) : (
                isAuthenticated && (
                  <button
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                    className={`btn-primary flex items-center ${
                      isFollowing ? 'bg-secondary-600 hover:bg-secondary-700' : ''
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'workflows', label: `Workflows (${workflows.length})`, icon: BookOpen },
                { id: 'followers', label: `Followers (${followers.length})`, icon: Users },
                { id: 'following', label: `Following (${following.length})`, icon: Heart },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'workflows' | 'followers' | 'following')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Workflows Tab */}
            {activeTab === 'workflows' && (
              <div>
                {workflows.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflows.map((workflow: Workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-secondary-500">
                    <BookOpen className="h-16 w-16 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-secondary-900 mb-2">No public workflows</h4>
                    <p>This user hasn't published any workflows yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Followers Tab */}
            {activeTab === 'followers' && (
              <div>
                {followers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {followers.map((follower: UserType) => (
                      <UserCard key={follower.id} user={follower} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-secondary-500">
                    <Users className="h-16 w-16 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-secondary-900 mb-2">No followers yet</h4>
                    <p>This user doesn't have any followers yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <div>
                {following.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {following.map((user: UserType) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-secondary-500">
                    <Heart className="h-16 w-16 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-secondary-900 mb-2">Not following anyone</h4>
                    <p>This user isn't following anyone yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface WorkflowCardProps {
  workflow: Workflow;
}

function WorkflowCard({ workflow }: WorkflowCardProps) {
  return (
    <Link to={`/workflows/${workflow.id}`} className="card hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h4 className="text-lg font-semibold text-secondary-900 truncate pr-2">
            {workflow.name}
          </h4>
          <span className="badge-primary text-xs whitespace-nowrap">
            {workflow.category}
          </span>
        </div>
        
        <p className="text-secondary-600 text-sm mb-4 line-clamp-2">
          {truncateText(workflow.description, 100)}
        </p>
        
        <div className="flex items-center justify-between text-xs text-secondary-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Download className="h-3 w-3 mr-1" />
              {workflow.downloadCount}
            </span>
            <span className="flex items-center">
              <Star className="h-3 w-3 mr-1" />
              {workflow.averageRating?.toFixed(1) || '0.0'}
            </span>
            <span className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" />
              {workflow.commentCount || 0}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-secondary-200">
          <div className="flex items-center justify-between text-xs text-secondary-500">
            <span>Updated {formatRelativeTime(workflow.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface UserCardProps {
  user: UserType;
}

function UserCard({ user }: UserCardProps) {
  return (
    <Link to={`/users/${user.username}`} className="card hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <img
            src={user.profile_image_url || generateAvatarUrl(user.username)}
            alt={user.username}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-secondary-900 truncate">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </h4>
            <p className="text-sm text-secondary-500">@{user.username}</p>
            {user.bio && (
              <p className="text-sm text-secondary-600 mt-1 line-clamp-2">
                {truncateText(user.bio, 80)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 