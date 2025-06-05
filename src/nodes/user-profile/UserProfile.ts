import {
	type INanoServiceResponse,
	type JsonLikeObject,
	NanoService,
	NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pg from "pg";

type UserProfileInputs = {
	operation: "get-profile" | "update-profile" | "change-password" | "upload-avatar" | "get-public-profile";
	userId?: string;
	token?: string;
	// Profile update fields
	firstName?: string;
	lastName?: string;
	bio?: string;
	profileImageUrl?: string;
	// Password change fields
	currentPassword?: string;
	newPassword?: string;
	// Public profile lookup
	username?: string;
};

type ProfileResponse = {
	success: boolean;
	user?: {
		id: string;
		email: string;
		username: string;
		firstName?: string;
		lastName?: string;
		bio?: string;
		profileImageUrl?: string;
		isVerified: boolean;
		createdAt: string;
		updatedAt: string;
	};
	message?: string;
};

export default class UserProfile extends NanoService<UserProfileInputs> {
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
					enum: ["get-profile", "update-profile", "change-password", "upload-avatar", "get-public-profile"]
				},
				userId: { type: "string" },
				token: { type: "string" },
				firstName: { type: "string", maxLength: 100 },
				lastName: { type: "string", maxLength: 100 },
				bio: { type: "string", maxLength: 1000 },
				profileImageUrl: { type: "string" },
				currentPassword: { type: "string", minLength: 6 },
				newPassword: { type: "string", minLength: 6 },
				username: { type: "string", minLength: 3 }
			},
			required: ["operation"],
		};

		this.outputSchema = {
			type: "object",
			properties: {
				success: { type: "boolean" },
				user: {
					type: "object",
					properties: {
						id: { type: "string" },
						email: { type: "string" },
						username: { type: "string" },
						firstName: { type: "string" },
						lastName: { type: "string" },
						bio: { type: "string" },
						profileImageUrl: { type: "string" },
						isVerified: { type: "boolean" },
						createdAt: { type: "string" },
						updatedAt: { type: "string" }
					}
				},
				message: { type: "string" }
			}
		};
	}

	async handle(ctx: Context, inputs: UserProfileInputs): Promise<INanoServiceResponse> {
		const response: NanoServiceResponse = new NanoServiceResponse();

		try {
			switch (inputs.operation) {
				case "get-profile":
					const profileResult = await this.getUserProfile(inputs);
					response.setSuccess(profileResult as JsonLikeObject);
					break;

				case "update-profile":
					const updateResult = await this.updateUserProfile(inputs);
					response.setSuccess(updateResult as JsonLikeObject);
					break;

				case "change-password":
					const passwordResult = await this.changePassword(inputs);
					response.setSuccess(passwordResult as JsonLikeObject);
					break;

				case "get-public-profile":
					const publicProfileResult = await this.getPublicProfile(inputs);
					response.setSuccess(publicProfileResult as JsonLikeObject);
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

	private async getUserProfile(inputs: UserProfileInputs): Promise<ProfileResponse> {
		if (!inputs.token) {
			throw new Error("Token is required to get profile");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getDbClient();

		try {
			const userResult = await client.query(
				"SELECT id, email, username, first_name, last_name, bio, profile_image_url, is_verified, created_at, updated_at FROM users WHERE id = $1",
				[userId]
			);

			if (userResult.rows.length === 0) {
				throw new Error("User not found");
			}

			const user = userResult.rows[0];

			return {
				success: true,
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					firstName: user.first_name,
					lastName: user.last_name,
					bio: user.bio,
					profileImageUrl: user.profile_image_url,
					isVerified: user.is_verified,
					createdAt: user.created_at.toISOString(),
					updatedAt: user.updated_at.toISOString()
				},
				message: "Profile retrieved successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async updateUserProfile(inputs: UserProfileInputs): Promise<ProfileResponse> {
		if (!inputs.token) {
			throw new Error("Token is required to update profile");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getDbClient();

		try {
			// Build dynamic update query
			const updateFields: string[] = [];
			const updateValues: any[] = [];
			let paramIndex = 1;

			if (inputs.firstName !== undefined) {
				updateFields.push(`first_name = $${paramIndex++}`);
				updateValues.push(inputs.firstName);
			}

			if (inputs.lastName !== undefined) {
				updateFields.push(`last_name = $${paramIndex++}`);
				updateValues.push(inputs.lastName);
			}

			if (inputs.bio !== undefined) {
				updateFields.push(`bio = $${paramIndex++}`);
				updateValues.push(inputs.bio);
			}

			if (inputs.profileImageUrl !== undefined) {
				updateFields.push(`profile_image_url = $${paramIndex++}`);
				updateValues.push(inputs.profileImageUrl);
			}

			if (updateFields.length === 0) {
				throw new Error("No fields to update");
			}

			// Add updated_at and userId
			updateFields.push(`updated_at = NOW()`);
			updateValues.push(userId);

			const updateQuery = `
				UPDATE users 
				SET ${updateFields.join(', ')} 
				WHERE id = $${paramIndex}
				RETURNING id, email, username, first_name, last_name, bio, profile_image_url, is_verified, created_at, updated_at
			`;

			const result = await client.query(updateQuery, updateValues);

			if (result.rows.length === 0) {
				throw new Error("User not found");
			}

			const user = result.rows[0];

			return {
				success: true,
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					firstName: user.first_name,
					lastName: user.last_name,
					bio: user.bio,
					profileImageUrl: user.profile_image_url,
					isVerified: user.is_verified,
					createdAt: user.created_at.toISOString(),
					updatedAt: user.updated_at.toISOString()
				},
				message: "Profile updated successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async changePassword(inputs: UserProfileInputs): Promise<ProfileResponse> {
		if (!inputs.token || !inputs.currentPassword || !inputs.newPassword) {
			throw new Error("Token, current password, and new password are required");
		}

		const userId = this.verifyToken(inputs.token);
		const client = await this.getDbClient();

		try {
			// Get current password hash
			const userResult = await client.query(
				"SELECT password_hash FROM users WHERE id = $1",
				[userId]
			);

			if (userResult.rows.length === 0) {
				throw new Error("User not found");
			}

			const user = userResult.rows[0];

			// Verify current password
			const isValidPassword = await bcrypt.compare(inputs.currentPassword, user.password_hash);
			if (!isValidPassword) {
				throw new Error("Current password is incorrect");
			}

			// Hash new password
			const hashedNewPassword = await bcrypt.hash(inputs.newPassword, 12);

			// Update password
			await client.query(
				"UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
				[hashedNewPassword, userId]
			);

			return {
				success: true,
				message: "Password changed successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async getPublicProfile(inputs: UserProfileInputs): Promise<ProfileResponse> {
		if (!inputs.username) {
			throw new Error("Username is required to get public profile");
		}

		const client = await this.getDbClient();

		try {
			const userResult = await client.query(
				"SELECT id, username, first_name, last_name, bio, profile_image_url, is_verified, created_at FROM users WHERE username = $1 AND is_active = true",
				[inputs.username]
			);

			if (userResult.rows.length === 0) {
				throw new Error("User not found");
			}

			const user = userResult.rows[0];

			return {
				success: true,
				user: {
					id: user.id,
					email: "", // Don't expose email in public profile
					username: user.username,
					firstName: user.first_name,
					lastName: user.last_name,
					bio: user.bio,
					profileImageUrl: user.profile_image_url,
					isVerified: user.is_verified,
					createdAt: user.created_at.toISOString(),
					updatedAt: ""
				},
				message: "Public profile retrieved successfully"
			};
		} finally {
			await client.end();
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