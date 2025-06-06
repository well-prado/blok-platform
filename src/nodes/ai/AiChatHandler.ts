import {
	type INanoServiceResponse,
	type JsonLikeObject,
	NanoService,
	NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";

type AiChatInputs = {
	messages: Array<{
		role: 'user' | 'assistant' | 'system';
		content: string;
	}>;
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

type ChatCompletionResponse = {
	success: boolean;
	message?: {
		role: 'assistant';
		content: string;
	};
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	error?: string;
};

export default class AiChatHandler extends NanoService<AiChatInputs> {
	private openaiApiKey: string;

	constructor() {
		super();

		this.openaiApiKey = process.env.OPENAI_API_KEY || "";

		this.inputSchema = {
			$schema: "http://json-schema.org/draft-04/schema#",
			type: "object",
			properties: {
				messages: {
					type: "array",
					items: {
						type: "object",
						properties: {
							role: { type: "string", enum: ["user", "assistant", "system"] },
							content: { type: "string" }
						},
						required: ["role", "content"]
					},
					minItems: 1
				},
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
			required: ["messages"],
		};

		this.outputSchema = {
			type: "object",
			properties: {
				success: { type: "boolean" },
				message: {
					type: "object",
					properties: {
						role: { type: "string" },
						content: { type: "string" }
					}
				},
				usage: {
					type: "object",
					properties: {
						prompt_tokens: { type: "number" },
						completion_tokens: { type: "number" },
						total_tokens: { type: "number" }
					}
				},
				error: { type: "string" }
			}
		};
	}

	async handle(ctx: Context, inputs: AiChatInputs): Promise<INanoServiceResponse> {
		const response: NanoServiceResponse = new NanoServiceResponse();

		try {
			if (!this.openaiApiKey) {
				// Fallback to mock chat completion
				const mockResponse = await this.generateMockChatResponse(inputs.messages);
				response.setSuccess(mockResponse as unknown as JsonLikeObject);
				return response;
			}

			const chatResult = await this.completeChatWithOpenAI(inputs);
			response.setSuccess(chatResult as unknown as JsonLikeObject);
		} catch (error: unknown) {
			const nodeError: GlobalError = new GlobalError((error as Error).message);
			nodeError.setCode(500);
			nodeError.setStack((error as Error).stack);
			nodeError.setName(this.name);
			response.setError(nodeError);
		}

		return response;
	}

	private async completeChatWithOpenAI(inputs: AiChatInputs): Promise<ChatCompletionResponse> {
		// For now, use mock responses since OpenAI integration requires API key setup
		return this.generateMockChatResponse(inputs.messages);
	}

	private async generateMockChatResponse(
		messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
	): Promise<ChatCompletionResponse> {
		const lastUserMessage = messages.filter(m => m.role === 'user').pop();
		
		if (!lastUserMessage) {
			return {
				success: false,
				error: 'No user message found in conversation'
			};
		}

		const userPrompt = lastUserMessage.content.toLowerCase();
		
		// Generate contextual responses based on user input
		let responseContent = '';

		if (userPrompt.includes('help') || userPrompt.includes('how')) {
			responseContent = `I'm here to help you create workflows! I can assist with:

🔧 **Workflow Generation**: Describe what you want to automate, and I'll create a complete workflow for you.

💡 **Examples**: 
- "Create a Slack notification when GitHub issues are created"
- "Build a data processing pipeline for CSV files"  
- "Set up API synchronization between services"

📋 **Workflow Components**: I can help you understand triggers, steps, and node configurations.

🎯 **Best Practices**: Get advice on workflow design, error handling, and optimization.

What specific workflow would you like to create today?`;
		} else if (userPrompt.includes('slack')) {
			responseContent = `Great choice! Slack integrations are very popular. I can help you create workflows that:

📢 **Send Notifications**: Trigger messages based on events from other services
🔄 **Two-way Integration**: Read from Slack and trigger actions elsewhere  
📊 **Status Updates**: Send automated reports and dashboard updates
🚨 **Alert Systems**: Monitor services and send critical alerts

Would you like me to generate a specific Slack workflow? Just describe:
- What should trigger the Slack message?
- Which channel should receive it?
- What information should be included?`;
		} else if (userPrompt.includes('email') || userPrompt.includes('mail')) {
			responseContent = `Email automation is essential for many workflows! I can create systems for:

📧 **Notifications**: Automated alerts based on events or schedules
📊 **Reports**: Regular data summaries and analytics
🔔 **Alerts**: Critical system notifications and warnings  
📋 **Forms**: Process form submissions and send confirmations

To create your email workflow, tell me:
- What should trigger the email?
- Who should receive it?
- What content should be included?
- Any specific formatting requirements?`;
		} else if (userPrompt.includes('data') || userPrompt.includes('csv') || userPrompt.includes('process')) {
			responseContent = `Data processing workflows are powerful! I can help you build:

📁 **File Processing**: CSV, JSON, XML parsing and transformation
🔄 **Data Pipelines**: Multi-step data cleaning and enrichment
📊 **Analytics**: Automated reporting and visualization
🗄️ **Database Operations**: Insert, update, and sync operations
📈 **ETL Processes**: Extract, Transform, Load workflows

For your data workflow, please specify:
- What type of data are you processing?
- Where is the source data coming from?
- What transformations are needed?
- Where should the results go?`;
		} else if (userPrompt.includes('api') || userPrompt.includes('integration')) {
			responseContent = `API integrations connect your tools seamlessly! I can create workflows for:

🔗 **Service Sync**: Keep data synchronized between platforms
🔄 **Data Flow**: Transform and route data between APIs
📡 **Webhooks**: Respond to events from external services
🔧 **CRUD Operations**: Create, read, update, delete across systems
🚀 **Automation**: Trigger complex sequences from simple events

To build your API integration:
- Which services need to be connected?
- What data should be synchronized?
- How often should it sync?
- Any data transformation requirements?`;
		} else if (userPrompt.includes('create') || userPrompt.includes('build') || userPrompt.includes('make')) {
			responseContent = `I'd love to help you create a workflow! To generate the best solution, please provide more details:

🎯 **Goal**: What do you want to achieve?
⚡ **Trigger**: What should start the workflow?
📝 **Steps**: What actions should happen?
📤 **Output**: Where should results go?

**Example prompts that work well:**
- "Create a workflow that sends a Slack message when a new GitHub issue is created"
- "Build an automation that processes CSV files and emails reports"
- "Make a workflow that syncs customer data between Salesforce and our database"

The more specific you are, the better workflow I can generate for you!`;
		} else {
			responseContent = `I understand you're interested in workflow automation! Based on your message, I can help you create something useful.

Here are some popular workflow types I can generate:

🔔 **Notifications**: Slack, email, SMS alerts
📊 **Data Processing**: CSV parsing, analytics, reporting  
🔗 **Integrations**: API syncing, webhook handling
📁 **File Operations**: Upload, transform, backup
🤖 **Automation**: Multi-step business processes

Could you be more specific about what you'd like to automate? For example:
- What system should trigger the workflow?
- What actions should happen?
- Where should the results go?

I'll generate a complete, working workflow based on your requirements!`;
		}

		return {
			success: true,
			message: {
				role: 'assistant',
				content: responseContent
			},
			usage: {
				prompt_tokens: 50,
				completion_tokens: responseContent.length / 4, // Rough estimate
				total_tokens: 50 + Math.floor(responseContent.length / 4)
			}
		};
	}
} 