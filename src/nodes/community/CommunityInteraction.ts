import {
	type INanoServiceResponse,
	type JsonLikeObject,
	NanoService,
	NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import jwt from "jsonwebtoken";
import pg from "pg";

type CommunityInputs = {
	operation: "add-comment" | "get-comments" | "rate-workflow" | "get-rating" | "follow-user" | "unfollow-user" | "get-followers" | "get-following" | "favorite-workflow" | "unfavorite-workflow" | "get-favorites" | "get-activity-feed";
	token?: string;
	// Comment operations
	workflowId?: string;
	content?: string;
	parentCommentId?: string;
	// Rating operations
	rating?: number;
	reviewText?: string;
	// Follow operations
	targetUserId?: string;
	// Pagination
	limit?: number;
	offset?: number;
};

type CommunityResponse = {
	success: boolean;
	data?: any;
	comments?: any[];
	rating?: any;
	users?: any[];
	workflows?: any[];
	activities?: any[];
	total?: number;
	message?: string;
};

export default class CommunityInteraction extends NanoService<CommunityInputs> {
	private jwtSecret: string;

	constructor() {
		super();

		this.jwtSecret = process.env.JWT_SECRET || "your-secret-key-here";

		this.inputSchema = {
			$schema: "http://json-schema.org/draft-04/schema#",
			type: "object",
			properties: {
				operation: {
					type: "string",
					enum: ["add-comment", "get-comments", "rate-workflow", "get-rating", "follow-user", "unfollow-user", "get-followers", "get-following", "favorite-workflow", "unfavorite-workflow", "get-favorites", "get-activity-feed"]
				},
				token: { type: "string" },
				workflowId: { type: "string" },
				content: { type: "string", maxLength: 2000 },
				parentCommentId: { type: ["string", "null"] },
				rating: { type: "number", minimum: 1, maximum: 5 },
				reviewText: { type: "string", maxLength: 1000 },
				targetUserId: { type: "string" },
				limit: { type: "number", minimum: 1, maximum: 100 },
				offset: { type: "number", minimum: 0 }
			},
			required: ["operation"],
		};

		this.outputSchema = {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: { type: "object" },
				comments: { type: "array" },
				rating: { type: "object" },
				users: { type: "array" },
				workflows: { type: "array" },
				activities: { type: "array" },
				total: { type: "number" },
				message: { type: "string" }
			}
		};
	}

	async handle(ctx: Context, inputs: CommunityInputs): Promise<INanoServiceResponse> {
		const response: NanoServiceResponse = new NanoServiceResponse();

		try {
			switch (inputs.operation) {
				case "add-comment":
					const commentResult = await this.addComment(inputs);
					response.setSuccess(commentResult as JsonLikeObject);
					break;

				case "get-comments":
					const commentsResult = await this.getComments(inputs);
					response.setSuccess(commentsResult as JsonLikeObject);
					break;

				case "rate-workflow":
					const ratingResult = await this.rateWorkflow(inputs);
					response.setSuccess(ratingResult as JsonLikeObject);
					break;

				case "get-rating":
					const getRatingResult = await this.getWorkflowRating(inputs);
					response.setSuccess(getRatingResult as JsonLikeObject);
					break;

				case "follow-user":
					const followResult = await this.followUser(inputs);
					response.setSuccess(followResult as JsonLikeObject);
					break;

				case "unfollow-user":
					const unfollowResult = await this.unfollowUser(inputs);
					response.setSuccess(unfollowResult as JsonLikeObject);
					break;

				case "get-followers":
					const followersResult = await this.getFollowers(inputs);
					response.setSuccess(followersResult as JsonLikeObject);
					break;

				case "get-following":
					const followingResult = await this.getFollowing(inputs);
					response.setSuccess(followingResult as JsonLikeObject);
					break;

				case "favorite-workflow":
					const favoriteResult = await this.favoriteWorkflow(inputs);
					response.setSuccess(favoriteResult as JsonLikeObject);
					break;

				case "unfavorite-workflow":
					const unfavoriteResult = await this.unfavoriteWorkflow(inputs);
					response.setSuccess(unfavoriteResult as JsonLikeObject);
					break;

				case "get-favorites":
					const favoritesResult = await this.getFavorites(inputs);
					response.setSuccess(favoritesResult as JsonLikeObject);
					break;

				case "get-activity-feed":
					const activityResult = await this.getActivityFeed(inputs);
					response.setSuccess(activityResult as JsonLikeObject);
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

	// Comment System
	private async addComment(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.token || !inputs.workflowId || !inputs.content) {
			throw new Error("Token, workflow ID, and content are required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getDbClient();

		try {
			const result = await client.query(
				`INSERT INTO workflow_comments (workflow_id, user_id, parent_comment_id, content) 
				 VALUES ($1, $2, $3, $4) 
				 RETURNING id, workflow_id, user_id, parent_comment_id, content, created_at, updated_at`,
				[inputs.workflowId, userId, inputs.parentCommentId || null, inputs.content]
			);

			// Log activity
			await this.logActivity(client, userId, 'comment_added', 'workflow', inputs.workflowId, {
				comment_id: result.rows[0].id,
				content_preview: inputs.content.substring(0, 100)
			});

			return {
				success: true,
				data: result.rows[0],
				message: "Comment added successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async getComments(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.workflowId) {
			throw new Error("Workflow ID is required");
		}

		const client = await this.getDbClient();
		const limit = inputs.limit || 20;
		const offset = inputs.offset || 0;

		try {
			const result = await client.query(
				`SELECT c.id, c.workflow_id, c.user_id, c.parent_comment_id, c.content, 
						c.is_edited, c.created_at, c.updated_at,
						u.username, u.first_name, u.last_name, u.profile_image_url
				 FROM workflow_comments c
				 JOIN users u ON c.user_id = u.id
				 WHERE c.workflow_id = $1 AND c.is_deleted = FALSE
				 ORDER BY c.created_at ASC
				 LIMIT $2 OFFSET $3`,
				[inputs.workflowId, limit, offset]
			);

			const countResult = await client.query(
				"SELECT COUNT(*) FROM workflow_comments WHERE workflow_id = $1 AND is_deleted = FALSE",
				[inputs.workflowId]
			);

			return {
				success: true,
				comments: result.rows,
				total: parseInt(countResult.rows[0].count),
				message: "Comments retrieved successfully"
			};
		} finally {
			await client.end();
		}
	}

	// Rating System
	private async rateWorkflow(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.token || !inputs.workflowId || !inputs.rating) {
			throw new Error("Token, workflow ID, and rating are required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getDbClient();

		try {
			// Upsert rating (update if exists, insert if not)
			const result = await client.query(
				`INSERT INTO workflow_ratings (workflow_id, user_id, rating, review_text) 
				 VALUES ($1, $2, $3, $4)
				 ON CONFLICT (workflow_id, user_id) 
				 DO UPDATE SET rating = $3, review_text = $4, updated_at = NOW()
				 RETURNING id, workflow_id, user_id, rating, review_text, created_at, updated_at`,
				[inputs.workflowId, userId, inputs.rating, inputs.reviewText || null]
			);

			// Log activity
			await this.logActivity(client, userId, 'rating_added', 'workflow', inputs.workflowId, {
				rating: inputs.rating,
				review_preview: inputs.reviewText ? inputs.reviewText.substring(0, 100) : null
			});

			return {
				success: true,
				data: result.rows[0],
				message: "Rating added successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async getWorkflowRating(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.workflowId) {
			throw new Error("Workflow ID is required");
		}

		const client = await this.getDbClient();

		try {
			// Get average rating and count
			const avgResult = await client.query(
				`SELECT AVG(rating)::NUMERIC(3,2) as avg_rating, COUNT(*) as rating_count
				 FROM workflow_ratings WHERE workflow_id = $1`,
				[inputs.workflowId]
			);

			// Get recent ratings with user info
			const ratingsResult = await client.query(
				`SELECT r.id, r.workflow_id, r.user_id, r.rating, r.review_text, r.created_at,
						u.username, u.first_name, u.last_name, u.profile_image_url
				 FROM workflow_ratings r
				 JOIN users u ON r.user_id = u.id
				 WHERE r.workflow_id = $1
				 ORDER BY r.created_at DESC
				 LIMIT 10`,
				[inputs.workflowId]
			);

			return {
				success: true,
				rating: {
					average: parseFloat(avgResult.rows[0].avg_rating) || 0,
					count: parseInt(avgResult.rows[0].rating_count),
					recent_ratings: ratingsResult.rows
				},
				message: "Rating information retrieved successfully"
			};
		} finally {
			await client.end();
		}
	}

	// Follow System
	private async followUser(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.token || !inputs.targetUserId) {
			throw new Error("Token and target user ID are required");
		}

		const userId = this.verifyToken(inputs.token);
		if (userId === inputs.targetUserId) {
			throw new Error("Users cannot follow themselves");
		}

		const client = await this.getDbClient();

		try {
			await client.query(
				`INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)
				 ON CONFLICT (follower_id, following_id) DO NOTHING`,
				[userId, inputs.targetUserId]
			);

			// Log activity
			await this.logActivity(client, userId, 'user_followed', 'user', inputs.targetUserId);

			return {
				success: true,
				message: "User followed successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async unfollowUser(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.token || !inputs.targetUserId) {
			throw new Error("Token and target user ID are required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getDbClient();

		try {
			await client.query(
				"DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2",
				[userId, inputs.targetUserId]
			);

			return {
				success: true,
				message: "User unfollowed successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async getFollowers(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.targetUserId) {
			throw new Error("Target user ID is required");
		}

		const client = await this.getDbClient();
		const limit = inputs.limit || 20;
		const offset = inputs.offset || 0;

		try {
			const result = await client.query(
				`SELECT u.id, u.username, u.first_name, u.last_name, u.profile_image_url, uf.created_at as followed_at
				 FROM user_follows uf
				 JOIN users u ON uf.follower_id = u.id
				 WHERE uf.following_id = $1 AND u.is_active = TRUE
				 ORDER BY uf.created_at DESC
				 LIMIT $2 OFFSET $3`,
				[inputs.targetUserId, limit, offset]
			);

			const countResult = await client.query(
				"SELECT COUNT(*) FROM user_follows uf JOIN users u ON uf.follower_id = u.id WHERE uf.following_id = $1 AND u.is_active = TRUE",
				[inputs.targetUserId]
			);

			return {
				success: true,
				users: result.rows,
				total: parseInt(countResult.rows[0].count),
				message: "Followers retrieved successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async getFollowing(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.targetUserId) {
			throw new Error("Target user ID is required");
		}

		const client = await this.getDbClient();
		const limit = inputs.limit || 20;
		const offset = inputs.offset || 0;

		try {
			const result = await client.query(
				`SELECT u.id, u.username, u.first_name, u.last_name, u.profile_image_url, uf.created_at as followed_at
				 FROM user_follows uf
				 JOIN users u ON uf.following_id = u.id
				 WHERE uf.follower_id = $1 AND u.is_active = TRUE
				 ORDER BY uf.created_at DESC
				 LIMIT $2 OFFSET $3`,
				[inputs.targetUserId, limit, offset]
			);

			const countResult = await client.query(
				"SELECT COUNT(*) FROM user_follows uf JOIN users u ON uf.following_id = u.id WHERE uf.follower_id = $1 AND u.is_active = TRUE",
				[inputs.targetUserId]
			);

			return {
				success: true,
				users: result.rows,
				total: parseInt(countResult.rows[0].count),
				message: "Following list retrieved successfully"
			};
		} finally {
			await client.end();
		}
	}

	// Favorites System
	private async favoriteWorkflow(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.token || !inputs.workflowId) {
			throw new Error("Token and workflow ID are required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getDbClient();

		try {
			await client.query(
				`INSERT INTO workflow_favorites (user_id, workflow_id) VALUES ($1, $2)
				 ON CONFLICT (user_id, workflow_id) DO NOTHING`,
				[userId, inputs.workflowId]
			);

			return {
				success: true,
				message: "Workflow favorited successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async unfavoriteWorkflow(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.token || !inputs.workflowId) {
			throw new Error("Token and workflow ID are required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getDbClient();

		try {
			await client.query(
				"DELETE FROM workflow_favorites WHERE user_id = $1 AND workflow_id = $2",
				[userId, inputs.workflowId]
			);

			return {
				success: true,
				message: "Workflow unfavorited successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async getFavorites(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.token) {
			throw new Error("Token is required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getDbClient();
		const limit = inputs.limit || 20;
		const offset = inputs.offset || 0;

		try {
			const result = await client.query(
				`SELECT workflow_id, created_at as favorited_at
				 FROM workflow_favorites
				 WHERE user_id = $1
				 ORDER BY created_at DESC
				 LIMIT $2 OFFSET $3`,
				[userId, limit, offset]
			);

			const countResult = await client.query(
				"SELECT COUNT(*) FROM workflow_favorites WHERE user_id = $1",
				[userId]
			);

			return {
				success: true,
				workflows: result.rows,
				total: parseInt(countResult.rows[0].count),
				message: "Favorite workflows retrieved successfully"
			};
		} finally {
			await client.end();
		}
	}

	// Activity Feed
	private async getActivityFeed(inputs: CommunityInputs): Promise<CommunityResponse> {
		if (!inputs.token) {
			throw new Error("Token is required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getDbClient();
		const limit = inputs.limit || 20;
		const offset = inputs.offset || 0;

		try {
			// Get activities from followed users + own activities
			const result = await client.query(
				`SELECT ua.id, ua.user_id, ua.activity_type, ua.target_type, ua.target_id, 
						ua.metadata, ua.created_at,
						u.username, u.first_name, u.last_name, u.profile_image_url
				 FROM user_activities ua
				 JOIN users u ON ua.user_id = u.id
				 WHERE ua.user_id = $1 OR ua.user_id IN (
					 SELECT following_id FROM user_follows WHERE follower_id = $1
				 )
				 ORDER BY ua.created_at DESC
				 LIMIT $2 OFFSET $3`,
				[userId, limit, offset]
			);

			return {
				success: true,
				activities: result.rows,
				message: "Activity feed retrieved successfully"
			};
		} finally {
			await client.end();
		}
	}

	// Helper Methods
	private async logActivity(client: any, userId: string, activityType: string, targetType: string, targetId: string, metadata?: any) {
		await client.query(
			"INSERT INTO user_activities (user_id, activity_type, target_type, target_id, metadata) VALUES ($1, $2, $3, $4, $5)",
			[userId, activityType, targetType, targetId, metadata ? JSON.stringify(metadata) : null]
		);
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

	private async getDbClient() {
		const { Client } = pg;
		const client = new Client({
			user: process.env.DB_USER || "postgres",
			password: process.env.DB_PASSWORD || "blok123",
			host: process.env.DB_HOST || "localhost",
			port: parseInt(process.env.DB_PORT || "5432"),
			database: process.env.DB_NAME || "blok_platform",
		});

		await client.connect();
		return client;
	}
} 