import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  Download,
  Heart,
  Share,
  Edit,
  Trash2,
  Calendar,
  User,
  Tag,
  MessageCircle,
  Eye,
  Code,
  Clock
} from 'lucide-react';

import { workflowApi, communityApi, type Comment, type Rating, type Workflow } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';
import { formatDate, formatRelativeTime, generateAvatarUrl } from '../lib/utils';
import ErrorBoundary from '../components/ErrorBoundary';
import WorkflowDiagram from '../components/WorkflowDiagram';

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'ratings' | 'code'>('overview');
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Fetch workflow details
  const { data: workflow, isLoading, error } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowApi.get(id!),
    enabled: !!id,
  });

  // Fetch comments
  const { data: commentsData } = useQuery({
    queryKey: ['workflow-comments', id],
    queryFn: () => communityApi.getComments(id!),
    enabled: !!id,
  });

  // Fetch ratings
  const { data: ratingsData } = useQuery({
    queryKey: ['workflow-ratings', id],
    queryFn: () => communityApi.getWorkflowRating(id!),
    enabled: !!id,
  });

  // Check if workflow is favorited
  const { data: favoritesData } = useQuery({
    queryKey: ['user-favorites'],
    queryFn: () => communityApi.getFavorites(),
    enabled: isAuthenticated,
  });

  // Initialize favorite status based on API data
  useEffect(() => {
    if (favoritesData?.workflows && id) {
      const isFav = favoritesData.workflows.some((w: Workflow) => w._id === id || w.id === id);
      setIsFavorited(isFav);
    }
  }, [favoritesData, id]);

  // Mutations
  const favoriteMutation = useMutation({
    mutationFn: (action: 'favorite' | 'unfavorite') => 
      action === 'favorite' 
        ? communityApi.favoriteWorkflow(id!)
        : communityApi.unfavoriteWorkflow(id!),
    onSuccess: () => {
      setIsFavorited(!isFavorited);
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
    },
    onError: () => {
      toast.error('Failed to update favorites');
    },
  });

  const rateMutation = useMutation({
    mutationFn: (data: { rating: number; reviewText?: string }) => 
      communityApi.rateWorkflow({ workflowId: id!, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-ratings', id] });
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      toast.success('Rating submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit rating');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => 
      communityApi.addComment({ workflowId: id!, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-comments', id] });
      setCommentText('');
      setShowCommentForm(false);
      toast.success('Comment added successfully');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => workflowApi.delete(id!),
    onSuccess: () => {
      toast.success('Workflow deleted successfully');
      navigate('/workflows');
    },
    onError: () => {
      toast.error('Failed to delete workflow');
    },
  });

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.warning('Please login to favorite workflows');
      return;
    }
    favoriteMutation.mutate(isFavorited ? 'unfavorite' : 'favorite');
  };

  const handleRate = (rating: number, reviewText?: string) => {
    if (!isAuthenticated) {
      toast.warning('Please login to rate workflows');
      return;
    }
    setUserRating(rating);
    rateMutation.mutate({ rating, reviewText });
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      toast.warning('Please login to comment');
      return;
    }
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const isOwner = user && workflow && workflow.createdBy === user.username;
  const comments = commentsData?.comments || [];
  const ratings = ratingsData?.ratings || [];
  const averageRating = ratingsData?.averageRating || 0;
  const ratingCount = ratingsData?.ratingCount || 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="card p-6 animate-pulse">
            <div className="h-8 bg-secondary-200 rounded mb-4"></div>
            <div className="h-4 bg-secondary-200 rounded mb-2"></div>
            <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-900">Workflow Not Found</h2>
          <p className="mt-2 text-secondary-600">The workflow you're looking for doesn't exist.</p>
          <Link to="/workflows" className="btn-primary mt-4">
            Browse Workflows
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-secondary-900">{workflow.name}</h1>
                <span className="badge-primary">{workflow.category}</span>
                {workflow.isPublic ? (
                  <span className="badge-success">Public</span>
                ) : (
                  <span className="badge-warning">Private</span>
                )}
              </div>
              <p className="text-lg text-secondary-600 mb-4">{workflow.description}</p>
              
              {/* Metadata */}
              <div className="flex items-center gap-6 text-sm text-secondary-500">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <Link to={`/users/${workflow.createdBy}`} className="hover:text-primary-600">
                    {workflow.createdBy}
                  </Link>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created {formatRelativeTime(workflow.createdAt)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Updated {formatRelativeTime(workflow.updatedAt)}
                </div>
                <div className="flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  {workflow.downloadCount} downloads
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleFavorite}
                className={`btn-outline flex items-center ${
                  isFavorited ? 'text-red-600 border-red-300' : ''
                }`}
                disabled={favoriteMutation.isPending}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Favorited' : 'Favorite'}
              </button>
              
              <button
                onClick={handleShare}
                className="btn-outline flex items-center"
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </button>
              
              {isOwner && (
                <>
                  <Link
                    to={`/workflows/${id}/edit`}
                    className="btn-secondary flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          {workflow.tags && workflow.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
                          {workflow.tags?.map((tag: string) => (
              <span key={tag} className="badge-secondary text-sm">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className={`h-5 w-5 ${
                    star <= (userRating || averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-secondary-300'
                  } hover:text-yellow-400 transition-colors`}
                  disabled={rateMutation.isPending}
                >
                  <Star className="h-full w-full" />
                </button>
              ))}
              <span className="ml-2 text-sm text-secondary-600">
                {averageRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'comments', label: `Comments (${comments?.length || 0})`, icon: MessageCircle },
                { id: 'ratings', label: `Ratings (${ratingCount})`, icon: Star },
                { id: 'code', label: 'Definition', icon: Code },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'comments' | 'ratings' | 'code')}
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
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-3">Workflow Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Version:</span>
                        <span className="font-medium">{workflow.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Category:</span>
                        <span className="font-medium">{workflow.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Public:</span>
                        <span className="font-medium">{workflow.isPublic ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Downloads:</span>
                        <span className="font-medium">{workflow.downloadCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Rating:</span>
                        <span className="font-medium">{averageRating.toFixed(1)}/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Created:</span>
                        <span className="font-medium">{formatDate(workflow.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-3">Workflow Structure</h3>
                  <WorkflowDiagram workflow={workflow} />
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Comments ({comments?.length || 0})
                  </h3>
                  {isAuthenticated && (
                    <button
                      onClick={() => setShowCommentForm(!showCommentForm)}
                      className="btn-primary"
                    >
                      Add Comment
                    </button>
                  )}
                </div>

                {/* Comment Form */}
                {showCommentForm && (
                  <div className="card p-4">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts about this workflow..."
                      className="input w-full h-24 resize-none"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => setShowCommentForm(false)}
                        className="btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleComment}
                        disabled={!commentText.trim() || commentMutation.isPending}
                        className="btn-primary"
                      >
                        {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {!comments || comments.length === 0 ? (
                    <div className="text-center py-8 text-secondary-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    comments?.map((comment: Comment) => (
                      <CommentCard key={comment.id} comment={comment} />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Ratings Tab */}
            {activeTab === 'ratings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-secondary-900">
                  Ratings & Reviews ({ratingCount})
                </h3>
                
                <div className="space-y-4">
                  {!ratings || ratings.length === 0 ? (
                    <div className="text-center py-8 text-secondary-500">
                      <Star className="h-12 w-12 mx-auto mb-2" />
                      <p>No ratings yet. Be the first to rate this workflow!</p>
                    </div>
                  ) : (
                    ratings?.map((rating: Rating) => (
                      <RatingCard key={rating.id} rating={rating} />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Code Tab */}
            {activeTab === 'code' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-secondary-900">Workflow Definition</h3>
                <div className="bg-secondary-900 text-secondary-100 p-4 rounded-lg overflow-auto">
                  <pre className="text-sm">
                    {JSON.stringify(
                      {
                        trigger: workflow.trigger,
                        steps: workflow.steps,
                        nodes: workflow.nodes
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

interface CommentCardProps {
  comment: Comment;
}

function CommentCard({ comment }: CommentCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start space-x-3">
        <img
          src={comment.profile_image_url || generateAvatarUrl(comment.username)}
          alt={comment.username}
          className="h-8 w-8 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-secondary-900">{comment.username}</span>
            <span className="text-sm text-secondary-500">
              {formatRelativeTime(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-secondary-400">(edited)</span>
            )}
          </div>
          <p className="text-secondary-700">{comment.content}</p>
        </div>
      </div>
    </div>
  );
}

interface RatingCardProps {
  rating: Rating;
}

function RatingCard({ rating }: RatingCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start space-x-3">
        <img
          src={rating.profile_image_url || generateAvatarUrl(rating.username)}
          alt={rating.username}
          className="h-8 w-8 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-secondary-900">{rating.username}</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= rating.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-secondary-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-secondary-500">
              {formatRelativeTime(rating.created_at)}
            </span>
          </div>
          {rating.review_text && (
            <p className="text-secondary-700">{rating.review_text}</p>
          )}
        </div>
      </div>
    </div>
  );
} 