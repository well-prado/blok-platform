import {
	type INanoServiceResponse,
	type JsonLikeObject,
	NanoService,
	NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import pg from "pg";

type UserAuthInputs = {
	operation: "register" | "login" | "verify-token" | "refresh-token";
	email?: string;
	password?: string;
	username?: string;
	token?: string;
	refreshToken?: string;
};

type AuthResponse = {
	success: boolean;
	user?: {
		id: string;
		email: string;
		username: string;
	};
	token?: string;
	refreshToken?: string;
	message?: string;
};

export default class UserAuth extends NanoService<UserAuthInputs> {
	private jwtSecret: string;
	private refreshSecret: string;

	constructor() {
		super();

		this.jwtSecret = process.env.JWT_SECRET || "your-secret-key-here";
		this.refreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-here";

		this.inputSchema = {
			$schema: "http://json-schema.org/draft-04/schema#",
			type: "object",
			properties: {
				operation: {
					type: "string",
					enum: ["register", "login", "verify-token", "refresh-token"]
				},
				email: { type: "string" },
				password: { type: "string", minLength: 6 },
				username: { type: "string", minLength: 3 },
				token: { type: "string" },
				refreshToken: { type: "string" }
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
						username: { type: "string" }
					}
				},
				token: { type: "string" },
				refreshToken: { type: "string" },
				message: { type: "string" }
			}
		};
	}

	async handle(ctx: Context, inputs: UserAuthInputs): Promise<INanoServiceResponse> {
		const response: NanoServiceResponse = new NanoServiceResponse();

		try {
			switch (inputs.operation) {
				case "register":
					const registerResult = await this.registerUser(inputs);
					response.setSuccess(registerResult as JsonLikeObject);
					break;

				case "login":
					const loginResult = await this.loginUser(inputs);
					response.setSuccess(loginResult as JsonLikeObject);
					break;

				case "verify-token":
					const verifyResult = await this.verifyToken(inputs);
					response.setSuccess(verifyResult as JsonLikeObject);
					break;

				case "refresh-token":
					const refreshResult = await this.refreshToken(inputs);
					response.setSuccess(refreshResult as JsonLikeObject);
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

	private async registerUser(inputs: UserAuthInputs): Promise<AuthResponse> {
		if (!inputs.email || !inputs.password || !inputs.username) {
			throw new Error("Email, password, and username are required for registration");
		}

		const client = await this.getDbClient();

		try {
			// Check if user already exists
			const existingUser = await client.query(
				"SELECT id FROM users WHERE email = $1 OR username = $2",
				[inputs.email, inputs.username]
			);

			if (existingUser.rows.length > 0) {
				throw new Error("User with this email or username already exists");
			}

			// Hash password
			const hashedPassword = await bcrypt.hash(inputs.password, 12);

			// Create user
			const userId = uuid();
			await client.query(
				`INSERT INTO users (id, email, username, password_hash, created_at, updated_at) 
				 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
				[userId, inputs.email, inputs.username, hashedPassword]
			);

			// Generate tokens
			const token = this.generateAccessToken(userId, inputs.email, inputs.username);
			const refreshToken = this.generateRefreshToken(userId);

			return {
				success: true,
				user: {
					id: userId,
					email: inputs.email,
					username: inputs.username
				},
				token,
				refreshToken,
				message: "User registered successfully"
			};
		} finally {
			await client.end();
		}
	}

	private async loginUser(inputs: UserAuthInputs): Promise<AuthResponse> {
		if (!inputs.email || !inputs.password) {
			throw new Error("Email and password are required for login");
		}

		const client = await this.getDbClient();

		try {
			// Get user
			const userResult = await client.query(
				"SELECT id, email, username, password_hash FROM users WHERE email = $1",
				[inputs.email]
			);

			if (userResult.rows.length === 0) {
				throw new Error("Invalid email or password");
			}

			const user = userResult.rows[0];

			// Verify password
			const isValidPassword = await bcrypt.compare(inputs.password, user.password_hash);
			if (!isValidPassword) {
				throw new Error("Invalid email or password");
			}

			// Generate tokens
			const token = this.generateAccessToken(user.id, user.email, user.username);
			const refreshToken = this.generateRefreshToken(user.id);

			return {
				success: true,
				user: {
					id: user.id,
					email: user.email,
					username: user.username
				},
				token,
				refreshToken,
				message: "Login successful"
			};
		} finally {
			await client.end();
		}
	}

	private async verifyToken(inputs: UserAuthInputs): Promise<AuthResponse> {
		if (!inputs.token) {
			throw new Error("Token is required for verification");
		}

		try {
			const decoded = jwt.verify(inputs.token, this.jwtSecret) as any;

			return {
				success: true,
				user: {
					id: decoded.userId,
					email: decoded.email,
					username: decoded.username
				},
				message: "Token is valid"
			};
		} catch (error) {
			throw new Error("Invalid or expired token");
		}
	}

	private async refreshToken(inputs: UserAuthInputs): Promise<AuthResponse> {
		if (!inputs.refreshToken) {
			throw new Error("Refresh token is required");
		}

		try {
			const decoded = jwt.verify(inputs.refreshToken, this.refreshSecret) as any;

			const client = await this.getDbClient();
			try {
				// Get user details
				const userResult = await client.query(
					"SELECT id, email, username FROM users WHERE id = $1",
					[decoded.userId]
				);

				if (userResult.rows.length === 0) {
					throw new Error("User not found");
				}

				const user = userResult.rows[0];

				// Generate new tokens
				const newToken = this.generateAccessToken(user.id, user.email, user.username);
				const newRefreshToken = this.generateRefreshToken(user.id);

				return {
					success: true,
					user: {
						id: user.id,
						email: user.email,
						username: user.username
					},
					token: newToken,
					refreshToken: newRefreshToken,
					message: "Token refreshed successfully"
				};
			} finally {
				await client.end();
			}
		} catch (error) {
			throw new Error("Invalid or expired refresh token");
		}
	}

	private generateAccessToken(userId: string, email: string, username: string): string {
		return jwt.sign(
			{ userId, email, username },
			this.jwtSecret,
			{ expiresIn: "1h" }
		);
	}

	private generateRefreshToken(userId: string): string {
		return jwt.sign(
			{ userId },
			this.refreshSecret,
			{ expiresIn: "7d" }
		);
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