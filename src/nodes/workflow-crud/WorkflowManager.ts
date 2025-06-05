import {
	type INanoServiceResponse,
	type JsonLikeObject,
	NanoService,
	NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";

type WorkflowInputs = {
	operation: "create" | "get" | "update" | "delete" | "list" | "search" | "get-by-user";
	token?: string;
	// Workflow data
	workflowId?: string;
	name?: string;
	description?: string;
	version?: string;
	trigger?: object;
	steps?: any[];
	nodes?: object;
	category?: string;
	tags?: string[];
	isPublic?: boolean;
	// Search and listing
	query?: string;
	username?: string;
	limit?: number;
	offset?: number;
	sortBy?: string;
	sortOrder?: string;
};

type WorkflowResponse = {
	success: boolean;
	workflow?: any;
	workflows?: any[];
	total?: number;
	message?: string;
};

export default class WorkflowManager extends NanoService<WorkflowInputs> {
	private jwtSecret: string;
	private mongoUri: string;

	constructor() {
		super();

		this.jwtSecret = process.env.JWT_SECRET || "your-secret-key-here";
		this.mongoUri = process.env.MONGO_URI || "mongodb://admin:blok123@localhost:27017/blok_platform?authSource=admin";

		this.inputSchema = {
			$schema: "http://json-schema.org/draft-04/schema#",
			type: "object",
			properties: {
				operation: {
					type: "string",
					enum: ["create", "get", "update", "delete", "list", "search", "get-by-user"]
				},
				token: { type: "string" },
				workflowId: { type: "string" },
				name: { type: "string", maxLength: 200 },
				description: { type: "string", maxLength: 1000 },
				version: { type: "string" },
				trigger: { type: "object" },
				steps: { type: "array" },
				nodes: { type: "object" },
				category: { type: "string" },
				tags: { type: "array" },
				isPublic: { type: "boolean" },
				query: { type: "string" },
				username: { type: "string" },
				limit: { type: "number", minimum: 1, maximum: 100 },
				offset: { type: "number", minimum: 0 },
				sortBy: { type: "string" },
				sortOrder: { type: "string", enum: ["asc", "desc"] }
			},
			required: ["operation"],
		};

		this.outputSchema = {
			type: "object",
			properties: {
				success: { type: "boolean" },
				workflow: { type: "object" },
				workflows: { type: "array" },
				total: { type: "number" },
				message: { type: "string" }
			}
		};
	}

	async handle(ctx: Context, inputs: WorkflowInputs): Promise<INanoServiceResponse> {
		const response: NanoServiceResponse = new NanoServiceResponse();

		try {
			switch (inputs.operation) {
				case "create":
					const createResult = await this.createWorkflow(inputs);
					response.setSuccess(createResult as JsonLikeObject);
					break;

				case "get":
					const getResult = await this.getWorkflow(inputs);
					response.setSuccess(getResult as JsonLikeObject);
					break;

				case "update":
					const updateResult = await this.updateWorkflow(inputs);
					response.setSuccess(updateResult as JsonLikeObject);
					break;

				case "delete":
					const deleteResult = await this.deleteWorkflow(inputs);
					response.setSuccess(deleteResult as JsonLikeObject);
					break;

				case "list":
					const listResult = await this.listWorkflows(inputs);
					response.setSuccess(listResult as JsonLikeObject);
					break;

				case "search":
					const searchResult = await this.searchWorkflows(inputs);
					response.setSuccess(searchResult as JsonLikeObject);
					break;

				case "get-by-user":
					const userWorkflowsResult = await this.getUserWorkflows(inputs);
					response.setSuccess(userWorkflowsResult as JsonLikeObject);
					break;

				default:
					throw new Error("Invalid operation");
			}
		} catch (error: unknown) {
			const nodeError: GlobalError = new GlobalError((error as Error).message);
			nodeError.setCode(400);
			nodeError.setStack((error as Error).stack);
			nodeError.setName(this.name);
			response.setError(nodeError);
		}

		return response;
	}

	private async createWorkflow(inputs: WorkflowInputs): Promise<WorkflowResponse> {
		if (!inputs.token || !inputs.name || !inputs.description || !inputs.trigger || !inputs.steps || !inputs.nodes) {
			throw new Error("Token, name, description, trigger, steps, and nodes are required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getMongoClient();

		try {
			const db = client.db();
			const collection = db.collection('workflows');

			const workflow = {
				name: inputs.name,
				description: inputs.description,
				version: inputs.version || "1.0.0",
				trigger: inputs.trigger,
				steps: inputs.steps,
				nodes: inputs.nodes,
				category: inputs.category || "General",
				tags: inputs.tags || [],
				isPublic: inputs.isPublic || false,
				createdBy: userId,
				createdAt: new Date(),
				updatedAt: new Date(),
				downloadCount: 0,
				rating: 0,
				ratingCount: 0
			};

			const result = await collection.insertOne(workflow);

			return {
				success: true,
				workflow: {
					...workflow,
					_id: result.insertedId.toString()
				},
				message: "Workflow created successfully"
			};
		} finally {
			await client.close();
		}
	}

	private async getWorkflow(inputs: WorkflowInputs): Promise<WorkflowResponse> {
		if (!inputs.workflowId) {
			throw new Error("Workflow ID is required");
		}

		const client = await this.getMongoClient();

		try {
			const db = client.db();
			const collection = db.collection('workflows');

			const workflow = await collection.findOne({ _id: new ObjectId(inputs.workflowId) });

			if (!workflow) {
				throw new Error("Workflow not found");
			}

			// Increment download count if workflow is accessed
			await collection.updateOne(
				{ _id: new ObjectId(inputs.workflowId) },
				{ $inc: { downloadCount: 1 } }
			);

			return {
				success: true,
				workflow: {
					...workflow,
					_id: workflow._id.toString()
				},
				message: "Workflow retrieved successfully"
			};
		} finally {
			await client.close();
		}
	}

	private async updateWorkflow(inputs: WorkflowInputs): Promise<WorkflowResponse> {
		if (!inputs.token || !inputs.workflowId) {
			throw new Error("Token and workflow ID are required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getMongoClient();

		try {
			const db = client.db();
			const collection = db.collection('workflows');

			// Check if user owns the workflow
			const existingWorkflow = await collection.findOne({ 
				_id: new ObjectId(inputs.workflowId),
				createdBy: userId 
			});

			if (!existingWorkflow) {
				throw new Error("Workflow not found or you don't have permission to update it");
			}

			// Build update object
			const updateData: any = {
				updatedAt: new Date()
			};

			if (inputs.name) updateData.name = inputs.name;
			if (inputs.description) updateData.description = inputs.description;
			if (inputs.version) updateData.version = inputs.version;
			if (inputs.trigger) updateData.trigger = inputs.trigger;
			if (inputs.steps) updateData.steps = inputs.steps;
			if (inputs.nodes) updateData.nodes = inputs.nodes;
			if (inputs.category) updateData.category = inputs.category;
			if (inputs.tags) updateData.tags = inputs.tags;
			if (inputs.isPublic !== undefined) updateData.isPublic = inputs.isPublic;

			const result = await collection.findOneAndUpdate(
				{ _id: new ObjectId(inputs.workflowId) },
				{ $set: updateData },
				{ returnDocument: 'after' }
			);

			if (!result || !result.value) {
				throw new Error("Failed to update workflow");
			}

			return {
				success: true,
				workflow: {
					...result.value,
					_id: result.value._id.toString()
				},
				message: "Workflow updated successfully"
			};
		} finally {
			await client.close();
		}
	}

	private async deleteWorkflow(inputs: WorkflowInputs): Promise<WorkflowResponse> {
		if (!inputs.token || !inputs.workflowId) {
			throw new Error("Token and workflow ID are required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getMongoClient();

		try {
			const db = client.db();
			const collection = db.collection('workflows');

			// Check if user owns the workflow
			const result = await collection.deleteOne({ 
				_id: new ObjectId(inputs.workflowId),
				createdBy: userId 
			});

			if (result.deletedCount === 0) {
				throw new Error("Workflow not found or you don't have permission to delete it");
			}

			return {
				success: true,
				message: "Workflow deleted successfully"
			};
		} finally {
			await client.close();
		}
	}

	private async listWorkflows(inputs: WorkflowInputs): Promise<WorkflowResponse> {
		const client = await this.getMongoClient();

		try {
			const db = client.db();
			const collection = db.collection('workflows');

			const limit = inputs.limit || 20;
			const offset = inputs.offset || 0;
			const sortBy = inputs.sortBy || 'createdAt';
			const sortOrder = inputs.sortOrder === 'asc' ? 1 : -1;

			// Only show public workflows in list
			const query = { isPublic: true };

			const workflows = await collection
				.find(query)
				.sort({ [sortBy]: sortOrder })
				.skip(offset)
				.limit(limit)
				.toArray();

			const total = await collection.countDocuments(query);

			const workflowsWithStringIds = workflows.map(workflow => ({
				...workflow,
				_id: workflow._id.toString()
			}));

			return {
				success: true,
				workflows: workflowsWithStringIds,
				total,
				message: "Workflows retrieved successfully"
			};
		} finally {
			await client.close();
		}
	}

	private async searchWorkflows(inputs: WorkflowInputs): Promise<WorkflowResponse> {
		if (!inputs.query) {
			throw new Error("Search query is required");
		}

		const client = await this.getMongoClient();

		try {
			const db = client.db();
			const collection = db.collection('workflows');

			const limit = inputs.limit || 20;
			const offset = inputs.offset || 0;

			// Text search on name and description for public workflows
			const searchQuery = {
				$and: [
					{ isPublic: true },
					{
						$or: [
							{ name: { $regex: inputs.query, $options: 'i' } },
							{ description: { $regex: inputs.query, $options: 'i' } },
							{ tags: { $in: [new RegExp(inputs.query, 'i')] } }
						]
					}
				]
			};

			const workflows = await collection
				.find(searchQuery)
				.sort({ rating: -1, downloadCount: -1 })
				.skip(offset)
				.limit(limit)
				.toArray();

			const total = await collection.countDocuments(searchQuery);

			const workflowsWithStringIds = workflows.map(workflow => ({
				...workflow,
				_id: workflow._id.toString()
			}));

			return {
				success: true,
				workflows: workflowsWithStringIds,
				total,
				message: `Found ${total} workflows matching "${inputs.query}"`
			};
		} finally {
			await client.close();
		}
	}

	private async getUserWorkflows(inputs: WorkflowInputs): Promise<WorkflowResponse> {
		if (!inputs.token) {
			throw new Error("Token is required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getMongoClient();

		try {
			const db = client.db();
			const collection = db.collection('workflows');

			const limit = inputs.limit || 20;
			const offset = inputs.offset || 0;
			const sortBy = inputs.sortBy || 'updatedAt';
			const sortOrder = inputs.sortOrder === 'asc' ? 1 : -1;

			const query = { createdBy: userId };

			const workflows = await collection
				.find(query)
				.sort({ [sortBy]: sortOrder })
				.skip(offset)
				.limit(limit)
				.toArray();

			const total = await collection.countDocuments(query);

			const workflowsWithStringIds = workflows.map(workflow => ({
				...workflow,
				_id: workflow._id.toString()
			}));

			return {
				success: true,
				workflows: workflowsWithStringIds,
				total,
				message: "User workflows retrieved successfully"
			};
		} finally {
			await client.close();
		}
	}

	private verifyToken(token: string): string {
		try {
			// Remove "Bearer " prefix if present
			const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
			const decoded = jwt.verify(cleanToken, this.jwtSecret) as any;
			return decoded.userId;
		} catch (error) {
			throw new Error("Invalid or expired token");
		}
	}

	private async getMongoClient() {
		const client = new MongoClient(this.mongoUri);
		await client.connect();
		return client;
	}
} 