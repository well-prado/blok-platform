import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Code,
  Eye,
  Settings,
  FileText,
  Globe,
  Lock
} from 'lucide-react';

import { workflowApi, type Workflow } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';

interface EditWorkflowFormData {
  name: string;
  description: string;
  category: string;
  version: string;
  isPublic: boolean;
  tags: string;
}

export default function EditWorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'details' | 'definition' | 'settings'>('details');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<EditWorkflowFormData>();

  // Fetch workflow details
  const { data: workflow, isLoading, error } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowApi.get(id!),
    enabled: !!id,
  });

  // Update workflow mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Workflow>) => workflowApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      queryClient.invalidateQueries({ queryKey: ['user-workflows'] });
      toast.success('Workflow updated successfully');
      navigate(`/workflows/${id}`);
    },
    onError: () => {
      toast.error('Failed to update workflow');
    },
  });

  // Pre-populate form when workflow loads
  useEffect(() => {
    if (workflow) {
      reset({
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        version: workflow.version,
        isPublic: workflow.isPublic,
        tags: workflow.tags?.join(', ') || '',
      });
    }
  }, [workflow, reset]);

  const onSubmit = (data: EditWorkflowFormData) => {
    if (!workflow) return;

    const tags = data.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    updateMutation.mutate({
      ...data,
      tags,
    });
  };

  // Check if user is owner
  const isOwner = user && workflow && workflow.createdBy === user.username;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
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

  if (error || !workflow) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-900">Workflow Not Found</h2>
          <p className="mt-2 text-secondary-600">The workflow you're trying to edit doesn't exist.</p>
          <Link to="/workflows" className="btn-primary mt-4">
            Back to Workflows
          </Link>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-900">Access Denied</h2>
          <p className="mt-2 text-secondary-600">You don't have permission to edit this workflow.</p>
          <Link to={`/workflows/${id}`} className="btn-primary mt-4">
            View Workflow
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to={`/workflows/${id}`}
              className="btn-ghost flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">Edit Workflow</h1>
              <p className="mt-2 text-lg text-secondary-600">
                Modify the details and settings for "{workflow.name}"
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          {/* Tabs */}
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'details', label: 'Details', icon: FileText },
                { id: 'definition', label: 'Definition', icon: Code },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'details' | 'definition' | 'settings')}
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

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <label className="label">
                    Workflow Name *
                  </label>
                  <input
                    {...register('name', { required: 'Workflow name is required' })}
                    className="input"
                    placeholder="My Awesome Workflow"
                  />
                  {errors.name && (
                    <p className="error-text">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">
                    Description *
                  </label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={4}
                    className="input resize-none"
                    placeholder="Describe what this workflow does..."
                  />
                  {errors.description && (
                    <p className="error-text">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      Category *
                    </label>
                    <select
                      {...register('category', { required: 'Category is required' })}
                      className="input"
                    >
                      <option value="">Select a category</option>
                      <option value="automation">Automation</option>
                      <option value="data-processing">Data Processing</option>
                      <option value="api-integration">API Integration</option>
                      <option value="notification">Notification</option>
                      <option value="utility">Utility</option>
                      <option value="ai-ml">AI/ML</option>
                      <option value="devops">DevOps</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.category && (
                      <p className="error-text">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">
                      Version *
                    </label>
                    <input
                      {...register('version', { required: 'Version is required' })}
                      className="input"
                      placeholder="1.0.0"
                    />
                    {errors.version && (
                      <p className="error-text">{errors.version.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">
                    Tags
                  </label>
                  <input
                    {...register('tags')}
                    className="input"
                    placeholder="automation, api, webhook"
                  />
                  <p className="text-sm text-secondary-500 mt-1">
                    Separate tags with commas to help others discover your workflow
                  </p>
                </div>
              </div>
            )}

            {/* Definition Tab */}
            {activeTab === 'definition' && (
              <div className="space-y-6">
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-secondary-900">Workflow Definition</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="btn-ghost text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </button>
                      <button
                        type="button"
                        className="btn-ghost text-sm"
                      >
                        <Code className="h-4 w-4 mr-1" />
                        Raw JSON
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-secondary-900 text-secondary-100 p-4 rounded-lg overflow-auto max-h-96">
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
                  
                  <p className="text-sm text-secondary-600 mt-2">
                    Visual workflow editor coming soon. For now, workflow definitions are read-only.
                  </p>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Visibility Settings</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        {...register('isPublic')}
                        type="checkbox"
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                      />
                      <span className="ml-3 text-sm">
                        <span className="font-medium text-secondary-900">Public Workflow</span>
                        <span className="text-secondary-500 block">
                          Make this workflow discoverable by other users
                        </span>
                      </span>
                      {watch('isPublic') ? (
                        <Globe className="h-4 w-4 text-green-500 ml-2" />
                      ) : (
                        <Lock className="h-4 w-4 text-secondary-400 ml-2" />
                      )}
                    </label>
                  </div>

                  {watch('isPublic') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <Globe className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800">
                            Public Workflow
                          </h4>
                          <p className="text-sm text-blue-700 mt-1">
                            This workflow will be visible to all users and can be downloaded, favorited, and commented on.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-secondary-200 pt-6">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Danger Zone</h3>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-red-800">
                          Delete Workflow
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                          Permanently delete this workflow. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
                            // TODO: Implement delete functionality
                            toast.error('Delete functionality will be available soon');
                          }
                        }}
                      >
                        Delete Workflow
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-secondary-200">
              <div className="text-sm text-secondary-500">
                {isDirty && 'You have unsaved changes'}
              </div>
              
              <div className="flex items-center space-x-3">
                <Link
                  to={`/workflows/${id}`}
                  className="btn-ghost"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={!isDirty || updateMutation.isPending}
                  className="btn-primary flex items-center"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 