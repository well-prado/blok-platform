import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Wand2, ArrowRight, Save, Eye } from 'lucide-react';
import AIChat from '../components/AIChat';
import WorkflowDiagram from '../components/WorkflowDiagram';
import NotificationDemo from '../components/NotificationDemo';
import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';
import type { Workflow } from '../lib/api';

export default function AIWorkflowPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [generatedWorkflow, setGeneratedWorkflow] = useState<Partial<Workflow> | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'preview' | 'json'>('chat');

  const handleWorkflowGenerated = (workflow: Partial<Workflow>) => {
    setGeneratedWorkflow(workflow);
    setActiveTab('preview');
    toast.success('Workflow generated successfully!');
  };

  const handleSaveWorkflow = () => {
    if (generatedWorkflow) {
      // Navigate to create page with pre-filled data
      const workflowData = encodeURIComponent(JSON.stringify(generatedWorkflow));
      navigate(`/workflows/create?ai-generated=${workflowData}`);
    }
  };

  const examples = [
    {
      title: 'Slack Notifications',
      description: 'Send Slack messages when events occur',
      prompt: 'Create a workflow that sends a Slack message when a new GitHub issue is created',
      icon: '💬',
    },
    {
      title: 'Data Processing',
      description: 'Process files and generate reports',
      prompt: 'Build a workflow that processes CSV data and sends email reports',
      icon: '📊',
    },
    {
      title: 'API Integration',
      description: 'Connect different services together',
      prompt: 'Create a workflow that syncs data between two APIs',
      icon: '🔗',
    },
    {
      title: 'File Management',
      description: 'Automate file operations',
      prompt: 'Make a workflow that backs up files to Google Drive daily',
      icon: '📁',
    },
  ];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="card p-8">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary-600" />
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">AI Workflow Generator</h1>
          <p className="text-lg text-secondary-600 mb-6">
            Use natural language to create powerful workflows with AI assistance
          </p>
          <p className="text-secondary-500 mb-6">
            Please sign in to start creating workflows with AI
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Sign In to Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-4xl font-bold text-secondary-900">AI Workflow Generator</h1>
          </div>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Describe what you want to automate in plain English, and our AI will generate a complete workflow for you
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - AI Chat */}
          <div className="space-y-6">
            {/* Examples */}
            {!generatedWorkflow && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
                  <Wand2 className="h-5 w-5 mr-2 text-primary-600" />
                  Try These Examples
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {examples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        // This would trigger the AI chat with the example prompt
                        toast.info('Click the chat interface and type this prompt');
                      }}
                      className="text-left p-3 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{example.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-secondary-900 group-hover:text-primary-600">
                            {example.title}
                          </h4>
                          <p className="text-sm text-secondary-600 mt-1">
                            {example.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-secondary-400 group-hover:text-primary-600" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Chat Interface */}
            <div className="h-96 lg:h-[600px]">
              <AIChat 
                onWorkflowGenerated={handleWorkflowGenerated}
                className="h-full"
              />
            </div>
          </div>

          {/* Right Column - Generated Workflow */}
          <div className="space-y-6">
            {generatedWorkflow ? (
              <div className="card">
                {/* Tabs */}
                <div className="border-b border-secondary-200">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { id: 'preview', label: 'Preview', icon: Eye },
                      { id: 'json', label: 'JSON', icon: '{}' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'chat' | 'preview' | 'json')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                          activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                        }`}
                      >
                        {typeof tab.icon === 'string' ? (
                          <span className="mr-2">{tab.icon}</span>
                        ) : (
                          <tab.icon className="h-4 w-4 mr-2" />
                        )}
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Preview Tab */}
                  {activeTab === 'preview' && (
                    <div className="space-y-6">
                      {/* Workflow Info */}
                      <div>
                        <h3 className="text-xl font-bold text-secondary-900 mb-2">
                          {generatedWorkflow.name}
                        </h3>
                        <p className="text-secondary-600 mb-4">
                          {generatedWorkflow.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="badge-primary">
                            {generatedWorkflow.category}
                          </span>
                          {generatedWorkflow.tags?.map((tag) => (
                            <span key={tag} className="badge-secondary">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-secondary-600">
                          <div>
                            <span className="font-medium">Steps:</span> {generatedWorkflow.steps?.length || 0}
                          </div>
                          <div>
                            <span className="font-medium">Trigger:</span> webhook
                          </div>
                        </div>
                      </div>

                      {/* Workflow Diagram */}
                      <div>
                        <h4 className="text-lg font-semibold text-secondary-900 mb-3">Workflow Structure</h4>
                        <WorkflowDiagram workflow={generatedWorkflow as Workflow} />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-3 pt-4 border-t border-secondary-200">
                        <button
                          onClick={handleSaveWorkflow}
                          className="btn-primary flex items-center"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save & Edit Workflow
                        </button>
                        <button
                          onClick={() => {
                            const dataStr = JSON.stringify(generatedWorkflow, null, 2);
                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${generatedWorkflow.name?.replace(/\s+/g, '-').toLowerCase() || 'ai-workflow'}.json`;
                            link.click();
                            URL.revokeObjectURL(url);
                            toast.success('Workflow downloaded');
                          }}
                          className="btn-outline"
                        >
                          Download JSON
                        </button>
                      </div>
                    </div>
                  )}

                  {/* JSON Tab */}
                  {activeTab === 'json' && (
                    <div>
                      <div className="bg-secondary-900 text-secondary-100 p-4 rounded-lg overflow-auto max-h-96">
                        <pre className="text-sm">
                          {JSON.stringify(generatedWorkflow, null, 2)}
                        </pre>
                      </div>
                      <div className="mt-4 flex items-center space-x-3">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(generatedWorkflow, null, 2));
                            toast.success('JSON copied to clipboard');
                          }}
                          className="btn-outline text-sm"
                        >
                          Copy JSON
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-secondary-400" />
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  No Workflow Generated Yet
                </h3>
                <p className="text-secondary-600">
                  Use the AI chat on the left to describe your workflow requirements. 
                  Once generated, you'll see a preview here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Demo Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-secondary-900 mb-8">
            🔔 Try Our Real-Time Notifications
          </h2>
          <NotificationDemo />
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-secondary-900 mb-8">
            Why Use AI for Workflow Creation?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Wand2 className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Natural Language</h3>
              <p className="text-secondary-600">
                Just describe what you want in plain English. No need to learn complex syntax or configuration formats.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Instant Results</h3>
              <p className="text-secondary-600">
                Get a complete, working workflow in seconds. No more spending hours setting up integrations.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Visual Preview</h3>
              <p className="text-secondary-600">
                See exactly how your workflow will function with our visual diagram before saving or running it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 