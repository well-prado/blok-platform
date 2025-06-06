import {
	type INanoServiceResponse,
	type JsonLikeObject,
	NanoService,
	NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";

type AiWorkflowInputs = {
	prompt: string;
	context?: Record<string, unknown>;
	options?: {
		temperature?: number;
		max_tokens?: number;
	};
	user?: {
		id: string;
		username: string;
		email: string;
	};
};

type WorkflowGenerationResponse = {
	success: boolean;
	workflow?: {
		name: string;
		description: string;
		category: string;
		tags: string[];
		trigger: {
			type: string;
			path: string;
		};
		steps: Array<{
			name: string;
			node: string;
			inputs: Record<string, unknown>;
		}>;
		isPublic: boolean;
	};
	reasoning?: string;
	message?: string;
};

export default class AiWorkflowGenerator extends NanoService<AiWorkflowInputs> {
	private openaiApiKey: string;

	constructor() {
		super();

		this.openaiApiKey = process.env.OPENAI_API_KEY || "";

		this.inputSchema = {
			$schema: "http://json-schema.org/draft-04/schema#",
			type: "object",
			properties: {
				prompt: { type: "string", minLength: 1 },
				context: { type: "object" },
				options: {
					type: "object",
					properties: {
						temperature: { type: "number", minimum: 0, maximum: 1 },
						max_tokens: { type: "number", minimum: 1 }
					}
				},
				user: {
					type: "object",
					properties: {
						id: { type: "string" },
						username: { type: "string" },
						email: { type: "string" }
					}
				}
			},
			required: ["prompt"],
		};

		this.outputSchema = {
			type: "object",
			properties: {
				success: { type: "boolean" },
				workflow: {
					type: "object",
					properties: {
						name: { type: "string" },
						description: { type: "string" },
						category: { type: "string" },
						tags: { type: "array", items: { type: "string" } },
						trigger: { type: "object" },
						steps: { type: "array" },
						isPublic: { type: "boolean" }
					}
				},
				reasoning: { type: "string" },
				message: { type: "string" }
			}
		};
	}

	async handle(ctx: Context, inputs: AiWorkflowInputs): Promise<INanoServiceResponse> {
		const response: NanoServiceResponse = new NanoServiceResponse();

		try {
			if (!this.openaiApiKey) {
				// Fallback to mock generation if no API key
				const mockWorkflow = await this.generateMockWorkflow(inputs.prompt);
				response.setSuccess(mockWorkflow as unknown as JsonLikeObject);
				return response;
			}

			const workflowResult = await this.generateWorkflowWithOpenAI(inputs);
			response.setSuccess(workflowResult as unknown as JsonLikeObject);
		} catch (error: unknown) {
			const nodeError: GlobalError = new GlobalError((error as Error).message);
			nodeError.setCode(500);
			nodeError.setStack((error as Error).stack);
			nodeError.setName(this.name);
			response.setError(nodeError);
		}

		return response;
	}

	private async generateWorkflowWithOpenAI(inputs: AiWorkflowInputs): Promise<WorkflowGenerationResponse> {
		// For now, use mock data since OpenAI integration requires API key setup
		// This would be replaced with actual OpenAI API calls
		return this.generateMockWorkflow(inputs.prompt);
	}

	private async generateMockWorkflow(prompt: string): Promise<WorkflowGenerationResponse> {
		const lowerPrompt = prompt.toLowerCase();
		
		// Enhanced mock workflow generation based on keywords
		if (lowerPrompt.includes('slack') || lowerPrompt.includes('notification')) {
			return {
				success: true,
				workflow: {
					name: 'Slack Notification Workflow',
					description: 'Automatically send Slack messages when specific events occur',
					category: 'notification',
					tags: ['slack', 'notification', 'webhook', 'automation'],
					trigger: {
						type: 'webhook',
						path: '/slack-notify'
					},
					steps: [
						{
							name: 'Parse Incoming Data',
							node: '@nanoservice-ts/json-parser',
							inputs: {
								data: '{{ ctx.request.body }}',
								validation: true
							}
						},
						{
							name: 'Format Message',
							node: '@nanoservice-ts/text-formatter',
							inputs: {
								template: 'New event: {{ ctx.parsed.title }} - {{ ctx.parsed.description }}',
								data: '{{ ctx.parsed }}'
							}
						},
						{
							name: 'Send Slack Message',
							node: '@nanoservice-ts/slack-webhook',
							inputs: {
								webhook_url: '{{ ctx.config.SLACK_WEBHOOK_URL }}',
								message: '{{ ctx.formatted_message }}',
								channel: '#notifications',
								username: 'Blok Bot'
							}
						}
					],
					isPublic: true
				},
				reasoning: 'Generated a Slack notification workflow with event parsing, message formatting, and Slack API integration',
				message: 'Workflow generated successfully for Slack notifications'
			};
		}

		if (lowerPrompt.includes('email') || lowerPrompt.includes('mail')) {
			return {
				success: true,
				workflow: {
					name: 'Email Notification System',
					description: 'Send automated email notifications based on triggers',
					category: 'notification',
					tags: ['email', 'notification', 'smtp', 'automation'],
					trigger: {
						type: 'webhook',
						path: '/send-email'
					},
					steps: [
						{
							name: 'Validate Email Data',
							node: '@nanoservice-ts/validator',
							inputs: {
								data: '{{ ctx.request.body }}',
								schema: {
									to: 'email',
									subject: 'string',
									message: 'string'
								}
							}
						},
						{
							name: 'Send Email',
							node: '@nanoservice-ts/email-sender',
							inputs: {
								to: '{{ ctx.validated.to }}',
								subject: '{{ ctx.validated.subject }}',
								body: '{{ ctx.validated.message }}',
								from: '{{ ctx.config.FROM_EMAIL }}'
							}
						}
					],
					isPublic: true
				},
				reasoning: 'Created an email notification workflow with input validation and SMTP integration',
				message: 'Email workflow generated with validation and sending capabilities'
			};
		}

		if (lowerPrompt.includes('data') || lowerPrompt.includes('csv') || lowerPrompt.includes('process')) {
			return {
				success: true,
				workflow: {
					name: 'Data Processing Pipeline',
					description: 'Process and transform data files with automated reporting',
					category: 'data-processing',
					tags: ['data', 'csv', 'processing', 'analytics', 'reports'],
					trigger: {
						type: 'webhook',
						path: '/process-data'
					},
					steps: [
						{
							name: 'Download File',
							node: '@nanoservice-ts/file-downloader',
							inputs: {
								url: '{{ ctx.request.body.file_url }}',
								destination: '/tmp/input-file'
							}
						},
						{
							name: 'Parse CSV',
							node: '@nanoservice-ts/csv-parser',
							inputs: {
								file_path: '{{ ctx.downloaded_file }}',
								headers: true,
								delimiter: ','
							}
						},
						{
							name: 'Transform Data',
							node: '@nanoservice-ts/data-transformer',
							inputs: {
								data: '{{ ctx.csv_data }}',
								operations: [
									{ type: 'filter', condition: 'value > 0' },
									{ type: 'group_by', field: 'category' },
									{ type: 'aggregate', function: 'sum', field: 'amount' }
								]
							}
						},
						{
							name: 'Generate Report',
							node: '@nanoservice-ts/report-generator',
							inputs: {
								data: '{{ ctx.transformed_data }}',
								format: 'html',
								template: 'analytics-report'
							}
						},
						{
							name: 'Send Report Email',
							node: '@nanoservice-ts/email-sender',
							inputs: {
								to: '{{ ctx.request.body.recipient_email }}',
								subject: 'Data Processing Report - {{ ctx.timestamp }}',
								body: '{{ ctx.report }}',
								attachments: ['{{ ctx.report_file }}']
							}
						}
					],
					isPublic: false
				},
				reasoning: 'Built a comprehensive data processing pipeline with CSV parsing, transformation, reporting, and email delivery',
				message: 'Data processing workflow created with full pipeline from input to reporting'
			};
		}

		if (lowerPrompt.includes('api') || lowerPrompt.includes('integration') || lowerPrompt.includes('sync')) {
			return {
				success: true,
				workflow: {
					name: 'API Integration Sync',
					description: 'Synchronize data between different API services',
					category: 'integration',
					tags: ['api', 'sync', 'integration', 'data-sync', 'webhook'],
					trigger: {
						type: 'webhook',
						path: '/sync-apis'
					},
					steps: [
						{
							name: 'Fetch Source Data',
							node: '@nanoservice-ts/http-client',
							inputs: {
								url: '{{ ctx.request.body.source_api_url }}',
								method: 'GET',
								headers: {
									'Authorization': 'Bearer {{ ctx.config.SOURCE_API_TOKEN }}',
									'Content-Type': 'application/json'
								}
							}
						},
						{
							name: 'Transform Data Format',
							node: '@nanoservice-ts/data-mapper',
							inputs: {
								data: '{{ ctx.source_response.data }}',
								mapping: {
									'id': 'external_id',
									'name': 'title',
									'created_at': 'timestamp'
								}
							}
						},
						{
							name: 'Update Target API',
							node: '@nanoservice-ts/http-client',
							inputs: {
								url: '{{ ctx.request.body.target_api_url }}',
								method: 'PUT',
								headers: {
									'Authorization': 'Bearer {{ ctx.config.TARGET_API_TOKEN }}',
									'Content-Type': 'application/json'
								},
								data: '{{ ctx.transformed_data }}'
							}
						},
						{
							name: 'Log Sync Result',
							node: '@nanoservice-ts/logger',
							inputs: {
								level: 'info',
								message: 'API sync completed',
								data: {
									source_records: '{{ ctx.source_response.data.length }}',
									sync_timestamp: '{{ ctx.timestamp }}',
									target_response: '{{ ctx.target_response.status }}'
								}
							}
						}
					],
					isPublic: true
				},
				reasoning: 'Created an API integration workflow with data fetching, transformation, and synchronization capabilities',
				message: 'API sync workflow generated with bidirectional data mapping and logging'
			};
		}

		// Default generic workflow
		return {
			success: true,
			workflow: {
				name: 'Custom Automation Workflow',
				description: 'A customizable workflow generated based on your requirements',
				category: 'automation',
				tags: ['custom', 'automation', 'webhook', 'api'],
				trigger: {
					type: 'webhook',
					path: '/custom-automation'
				},
				steps: [
					{
						name: 'Process Request',
						node: '@nanoservice-ts/request-processor',
						inputs: {
							data: '{{ ctx.request.body }}',
							validation: true,
							sanitization: true
						}
					},
					{
						name: 'Execute Logic',
						node: '@nanoservice-ts/custom-processor',
						inputs: {
							input_data: '{{ ctx.processed_request }}',
							operation: 'process',
							config: '{{ ctx.config }}'
						}
					},
					{
						name: 'Send Response',
						node: '@nanoservice-ts/response-formatter',
						inputs: {
							data: '{{ ctx.processed_result }}',
							format: 'json',
							status_code: 200
						}
					}
				],
				isPublic: false
			},
			reasoning: 'Generated a flexible automation workflow that can be customized for various use cases',
			message: 'Custom workflow created - you can modify the nodes and logic to fit your specific needs'
		};
	}
} 