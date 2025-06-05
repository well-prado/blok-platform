import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  Save,
  Eye,
  Code,
  Settings,
  Plus,
  X,
  FileText,
  Zap,
  Globe,
  Tag,
  Info
} from 'lucide-react';

import { workflowApi } from '../lib/api';
import { toast } from '../stores/toast';

interface WorkflowFormData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  version: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
}

interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
}

const WORKFLOW_CATEGORIES = [
  'Data Processing',
  'API Integration',
  'Automation',
  'Analytics',
  'Authentication',
  'File Processing',
  'Notification',
  'Database',
  'AI/ML',
  'Other'
];

const COMMON_TRIGGERS = [
  { id: 'http', name: 'HTTP Request', description: 'Trigger on HTTP requests' },
  { id: 'schedule', name: 'Schedule', description: 'Trigger on time intervals' },
  { id: 'webhook', name: 'Webhook', description: 'Trigger on external webhooks' },
  { id: 'event', name: 'Event', description: 'Trigger on custom events' }
];

const SAMPLE_NODES = [
  { id: 'http-request', name: 'HTTP Request', type: 'action', description: 'Make HTTP requests' },
  { id: 'transform-data', name: 'Transform Data', type: 'transform', description: 'Transform and manipulate data' },
  { id: 'conditional', name: 'Conditional', type: 'logic', description: 'Add conditional logic' },
  { id: 'loop', name: 'Loop', type: 'logic', description: 'Iterate over data' },
  { id: 'send-email', name: 'Send Email', type: 'action', description: 'Send email notifications' },
  { id: 'database-query', name: 'Database Query', type: 'data', description: 'Query databases' }
];

export default function CreateWorkflowPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'form' | 'visual' | 'json'>('form');
  const [currentTrigger, setCurrentTrigger] = useState(COMMON_TRIGGERS[0]);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [nodes] = useState<WorkflowNode[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [jsonView, setJsonView] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<WorkflowFormData>({
    defaultValues: {
      name: '',
      description: '',
      category: WORKFLOW_CATEGORIES[0],
      tags: [],
      isPublic: true,
      version: '1.0.0',
    },
  });

  const watchedTags = watch('tags') || [];

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: (data: WorkflowFormData) => workflowApi.create(data),
    onSuccess: () => {
      toast.success('Workflow created successfully!');
      navigate('/workflows');
    },
    onError: () => {
      toast.error('Failed to create workflow');
    },
  });

  const onSubmit = (data: WorkflowFormData) => {
    const workflowData = {
      ...data,
      trigger: {
        type: currentTrigger.id,
        path: '/',
        method: 'POST',
        ...currentTrigger
      },
      steps: steps.map((step, index) => ({
        id: step.id,
        name: step.name,
        type: step.type,
        order: index,
        config: step.config
      })),
      nodes: nodes.reduce((acc, node) => {
        acc[node.id] = {
          type: node.type,
          name: node.name,
          config: node.config
        };
        return acc;
      }, {} as Record<string, unknown>)
    };

    createWorkflowMutation.mutate(workflowData);
  };

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      const newTags = [...watchedTags, tagInput.trim()];
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter(tag => tag !== tagToRemove);
    setValue('tags', newTags);
  };

  const addStep = (nodeType: { id: string; name: string }) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: nodeType.name,
      type: nodeType.id,
      config: {}
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  const generateWorkflowJSON = () => {
    return JSON.stringify({
      trigger: {
        type: currentTrigger.id,
        path: '/',
        method: 'POST'
      },
      steps: steps.map((step, index) => ({
        id: step.id,
        name: step.name,
        type: step.type,
        order: index,
        config: step.config
      })),
      nodes: nodes.reduce((acc, node) => {
        acc[node.id] = {
          type: node.type,
          name: node.name,
          config: node.config
        };
        return acc;
      }, {} as Record<string, unknown>)
    }, null, 2);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Create New Workflow</h1>
          <p className="mt-2 text-lg text-secondary-600">
            Build powerful automation workflows with our visual editor
          </p>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'form', label: 'Basic Info', icon: FileText },
                { id: 'visual', label: 'Visual Builder', icon: Settings },
                { id: 'json', label: 'JSON Definition', icon: Code },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'form' | 'visual' | 'json')}
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
            {/* Basic Info Tab */}
            {activeTab === 'form' && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="label">Workflow Name *</label>
                      <input
                        {...register('name', { 
                          required: 'Workflow name is required',
                          minLength: { value: 3, message: 'Name must be at least 3 characters' }
                        })}
                        className="input"
                        placeholder="My Awesome Workflow"
                      />
                      {errors.name && (
                        <p className="error-text">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Description *</label>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Category</label>
                        <select {...register('category')} className="input">
                          {WORKFLOW_CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label">Version</label>
                        <input
                          {...register('version')}
                          className="input"
                          placeholder="1.0.0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="label">Tags</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          className="input flex-1"
                          placeholder="Add tags..."
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="btn-outline px-3"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {watchedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {watchedTags.map(tag => (
                            <span key={tag} className="badge-secondary flex items-center">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="label flex items-center">
                        <input
                          {...register('isPublic')}
                          type="checkbox"
                          className="mr-2"
                        />
                        <Globe className="h-4 w-4 mr-1" />
                        Make workflow public
                      </label>
                      <p className="text-sm text-secondary-500 mt-1">
                        Public workflows can be discovered and used by the community
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Getting Started</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Fill out the basic information, then use the Visual Builder to design your workflow logic.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/workflows')}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('visual')}
                    className="btn-secondary"
                  >
                    Continue to Builder
                  </button>
                </div>
              </form>
            )}

            {/* Visual Builder Tab */}
            {activeTab === 'visual' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Node Palette */}
                  <div className="lg:col-span-1">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Trigger</h3>
                    <div className="space-y-2 mb-6">
                      {COMMON_TRIGGERS.map(trigger => (
                        <button
                          key={trigger.id}
                          onClick={() => setCurrentTrigger(trigger)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                            currentTrigger.id === trigger.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-secondary-200 hover:border-secondary-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <Zap className="h-4 w-4 mr-2 text-primary-600" />
                            <div>
                              <div className="font-medium text-secondary-900">{trigger.name}</div>
                              <div className="text-sm text-secondary-500">{trigger.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Available Nodes</h3>
                    <div className="space-y-2">
                      {SAMPLE_NODES.map(node => (
                        <button
                          key={node.id}
                          onClick={() => addStep(node)}
                          className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <Settings className="h-4 w-4 mr-2 text-secondary-600" />
                            <div>
                              <div className="font-medium text-secondary-900">{node.name}</div>
                              <div className="text-sm text-secondary-500">{node.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Workflow Canvas */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Workflow Steps</h3>
                    
                    {/* Trigger */}
                    <div className="mb-4">
                      <div className="flex items-center p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
                        <Zap className="h-5 w-5 text-primary-600 mr-3" />
                        <div>
                          <div className="font-medium text-primary-900">Trigger: {currentTrigger.name}</div>
                          <div className="text-sm text-primary-700">{currentTrigger.description}</div>
                        </div>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-4">
                      {steps.length === 0 ? (
                        <div className="text-center py-12 text-secondary-500">
                          <Settings className="h-12 w-12 mx-auto mb-4" />
                          <p>No steps added yet.</p>
                          <p className="text-sm">Click on nodes from the left panel to add them to your workflow.</p>
                        </div>
                      ) : (
                        steps.map((step, index) => (
                          <div key={step.id} className="relative">
                            {index > 0 && (
                              <div className="absolute -top-2 left-6 w-0.5 h-4 bg-secondary-300"></div>
                            )}
                            <div className="flex items-center p-4 bg-white border border-secondary-200 rounded-lg hover:border-secondary-300 transition-colors">
                              <Settings className="h-5 w-5 text-secondary-600 mr-3" />
                              <div className="flex-1">
                                <div className="font-medium text-secondary-900">{step.name}</div>
                                <div className="text-sm text-secondary-500">Step {index + 1}</div>
                              </div>
                              <button
                                onClick={() => removeStep(step.id)}
                                className="text-secondary-400 hover:text-red-600 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setActiveTab('form')}
                        className="btn-outline"
                      >
                        Back to Info
                      </button>
                      <button
                        onClick={() => setActiveTab('json')}
                        className="btn-secondary"
                      >
                        View JSON
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* JSON Definition Tab */}
            {activeTab === 'json' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-secondary-900">Workflow Definition</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setJsonView(!jsonView)}
                      className="btn-outline flex items-center"
                    >
                      {jsonView ? <Eye className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
                      {jsonView ? 'Preview' : 'Edit JSON'}
                    </button>
                  </div>
                </div>

                <div className="bg-secondary-900 text-secondary-100 p-4 rounded-lg overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {generateWorkflowJSON()}
                  </pre>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setActiveTab('visual')}
                    className="btn-outline"
                  >
                    Back to Builder
                  </button>
                  
                  <div className="space-x-3">
                    <button
                      onClick={handleSubmit(onSubmit)}
                      disabled={!isValid || createWorkflowMutation.isPending}
                      className="btn-primary flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createWorkflowMutation.isPending ? 'Creating...' : 'Create Workflow'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 