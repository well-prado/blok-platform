import { ChevronRight, Play, CheckCircle, AlertCircle } from 'lucide-react';
import type { Workflow } from '../lib/api';

interface WorkflowStep {
  name?: string;
  node?: string;
  type?: string;
  description?: string;
  inputs?: Record<string, unknown>;
}

interface WorkflowDiagramProps {
  workflow: Workflow;
  className?: string;
}

export default function WorkflowDiagram({ workflow, className = '' }: WorkflowDiagramProps) {
  // Extract steps from workflow
  const steps = (workflow.steps || []) as WorkflowStep[];
  const nodes = workflow.nodes || {};

  // Simple step visualization
  const getStepIcon = (step: WorkflowStep) => {
    const nodeType = step.node || step.type;
    
    if (nodeType === 'trigger' || step.name?.includes('trigger')) {
      return <Play className="h-4 w-4" />;
    }
    if (nodeType === 'condition' || step.name?.includes('if')) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStepColor = (step: WorkflowStep) => {
    const nodeType = step.node || step.type;
    
    if (nodeType === 'trigger' || step.name?.includes('trigger')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (nodeType === 'condition' || step.name?.includes('if')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  if (!steps.length) {
    return (
      <div className={`bg-secondary-50 p-8 rounded-lg text-center ${className}`}>
        <div className="text-secondary-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-3" />
          <p className="text-sm">No workflow steps defined</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg border border-secondary-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-secondary-900">Workflow Flow</h4>
        <div className="text-xs text-secondary-500">
          {steps.length} step{steps.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Horizontal flow for smaller workflows */}
      {steps.length <= 4 ? (
        <div className="flex items-center space-x-2 overflow-x-auto">
          {steps.map((step: WorkflowStep, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getStepColor(step)} min-w-max`}
              >
                {getStepIcon(step)}
                <span className="text-sm font-medium">
                  {step.name || step.node || `Step ${index + 1}`}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-secondary-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Vertical flow for larger workflows */
        <div className="space-y-3">
          {steps.map((step: WorkflowStep, index: number) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${getStepColor(step)}`}
                >
                  {getStepIcon(step)}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-6 bg-secondary-300 mt-2"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-secondary-900">
                    {step.name || step.node || `Step ${index + 1}`}
                  </h5>
                  <span className="text-xs text-secondary-500">
                    {step.node || 'Custom'}
                  </span>
                </div>
                {step.description && (
                  <p className="text-xs text-secondary-600 mt-1">
                    {step.description}
                  </p>
                )}
                {step.inputs && Object.keys(step.inputs).length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-secondary-500 mb-1">Inputs:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(step.inputs).slice(0, 3).map((input) => (
                        <span
                          key={input}
                          className="inline-block px-2 py-1 text-xs bg-secondary-100 text-secondary-600 rounded"
                        >
                          {input}
                        </span>
                      ))}
                      {Object.keys(step.inputs).length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-secondary-100 text-secondary-600 rounded">
                          +{Object.keys(step.inputs).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workflow Statistics */}
      <div className="mt-6 pt-4 border-t border-secondary-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-secondary-900">{steps.length}</div>
            <div className="text-xs text-secondary-500">Steps</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-secondary-900">
              {Object.keys(nodes).length}
            </div>
            <div className="text-xs text-secondary-500">Nodes</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-secondary-900">
              {workflow.trigger ? 1 : 0}
            </div>
            <div className="text-xs text-secondary-500">Triggers</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-secondary-900">
              {steps.filter((step: WorkflowStep) => step.node?.includes('condition') || step.name?.includes('if')).length}
            </div>
            <div className="text-xs text-secondary-500">Conditions</div>
          </div>
        </div>
      </div>
    </div>
  );
} 