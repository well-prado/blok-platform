import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Download, Copy, X } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';
import { aiApi, type Workflow } from '../lib/api';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workflowData?: Partial<Workflow>;
}

interface AIChatProps {
  onWorkflowGenerated?: (workflow: Partial<Workflow>) => void;
  className?: string;
}

export default function AIChat({ onWorkflowGenerated, className = '' }: AIChatProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "👋 Hi! I'm your AI workflow assistant. I can help you create workflows using natural language. Just describe what you want to automate!\n\nFor example:\n• \"Create a workflow that sends a Slack message when a new GitHub issue is created\"\n• \"Build an automation that backs up files to Google Drive daily\"\n• \"Make a workflow that processes CSV data and sends email reports\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateWorkflow = async (prompt: string): Promise<Partial<Workflow>> => {
    try {
      const response = await aiApi.generateWorkflow(prompt, {
        user_preferences: user ? {
          username: user.username,
          email: user.email
        } : undefined
      });

      if (response.success && response.workflow) {
        return response.workflow;
      } else {
        throw new Error(response.message || 'Failed to generate workflow');
      }
    } catch (error) {
      console.error('Workflow generation error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const workflowData = await generateWorkflow(userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `🎉 I've generated a workflow for you! Here's what I created:\n\n**${workflowData.name}**\n${workflowData.description}\n\nThe workflow includes ${workflowData.steps?.length || 0} steps and can be triggered via webhook. You can review and customize it further, or use it as-is.`,
        timestamp: new Date(),
        workflowData,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (onWorkflowGenerated) {
        onWorkflowGenerated(workflowData);
      }

    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '❌ Sorry, I encountered an error while generating your workflow. Please try again with a different description.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWorkflowAction = (action: 'download' | 'copy', workflowData: Partial<Workflow>) => {
    if (action === 'download') {
      const dataStr = JSON.stringify(workflowData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workflowData.name?.replace(/\s+/g, '-').toLowerCase() || 'workflow'}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Workflow downloaded');
    } else if (action === 'copy') {
      navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2));
      toast.success('Workflow copied to clipboard');
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: "👋 Hi! I'm your AI workflow assistant. I can help you create workflows using natural language. Just describe what you want to automate!",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg border border-secondary-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-secondary-900">AI Workflow Assistant</h3>
        </div>
        <button
          onClick={clearConversation}
          className="p-2 text-secondary-500 hover:text-secondary-700 transition-colors"
          title="Clear conversation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                {message.type === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Workflow Preview */}
                  {message.workflowData && (
                    <div className="mt-3 p-3 bg-white rounded border border-secondary-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-secondary-900">{message.workflowData.name}</h4>
                          <p className="text-xs text-secondary-600 mt-1">{message.workflowData.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-secondary-500">
                            <span>Steps: {message.workflowData.steps?.length || 0}</span>
                            <span>Category: {message.workflowData.category}</span>
                            <span>Tags: {message.workflowData.tags?.length || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleWorkflowAction('copy', message.workflowData!)}
                            className="p-1 text-secondary-500 hover:text-primary-600 transition-colors"
                            title="Copy workflow"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleWorkflowAction('download', message.workflowData!)}
                            className="p-1 text-secondary-500 hover:text-primary-600 transition-colors"
                            title="Download workflow"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-secondary-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-secondary-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={user ? "Describe the workflow you want to create..." : "Please login to use AI assistant"}
            disabled={!user || isGenerating}
            className="flex-1 input"
          />
          <button
            type="submit"
            disabled={!user || !input.trim() || isGenerating}
            className="btn-primary flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {!user && (
          <p className="text-xs text-secondary-500 mt-2">
            Sign in to start creating workflows with AI assistance
          </p>
        )}
      </form>
    </div>
  );
} 