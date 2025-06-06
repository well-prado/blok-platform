import {
	type INanoServiceResponse,
	type JsonLikeObject,
	NanoService,
	NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import pg from "pg";

type AiSemanticSearchInputs = {
	query: string;
	filters?: {
		category?: string;
		tags?: string[];
		isPublic?: boolean;
		createdBy?: string;
	};
	limit?: number;
	user?: {
		id: string;
		username: string;
		email: string;
	};
};

type SemanticSearchResponse = {
	success: boolean;
	results?: Array<{
		workflow_id: string;
		name: string;
		description: string;
		category: string;
		tags: string[];
		created_by: string;
		is_public: boolean;
		relevance_score: number;
		match_reason: string;
	}>;
	total_count?: number;
	query_analysis?: {
		intent: string;
		keywords: string[];
		category_suggestions: string[];
	};
	error?: string;
};

export default class AiSemanticSearch extends NanoService<AiSemanticSearchInputs> {
	constructor() {
		super();

		this.inputSchema = {
			$schema: "http://json-schema.org/draft-04/schema#",
			type: "object",
			properties: {
				query: { type: "string", minLength: 1 },
				filters: {
					type: "object",
					properties: {
						category: { type: "string" },
						tags: { type: "array", items: { type: "string" } },
						isPublic: { type: "boolean" },
						createdBy: { type: "string" }
					}
				},
				limit: { type: "number", minimum: 1, maximum: 50 },
				user: {
					type: "object",
					properties: {
						id: { type: "string" },
						username: { type: "string" },
						email: { type: "string" }
					}
				}
			},
			required: ["query"],
		};

		this.outputSchema = {
			type: "object",
			properties: {
				success: { type: "boolean" },
				results: {
					type: "array",
					items: {
						type: "object",
						properties: {
							workflow_id: { type: "string" },
							name: { type: "string" },
							description: { type: "string" },
							category: { type: "string" },
							tags: { type: "array", items: { type: "string" } },
							created_by: { type: "string" },
							is_public: { type: "boolean" },
							relevance_score: { type: "number" },
							match_reason: { type: "string" }
						}
					}
				},
				total_count: { type: "number" },
				query_analysis: {
					type: "object",
					properties: {
						intent: { type: "string" },
						keywords: { type: "array", items: { type: "string" } },
						category_suggestions: { type: "array", items: { type: "string" } }
					}
				},
				error: { type: "string" }
			}
		};
	}

	async handle(ctx: Context, inputs: AiSemanticSearchInputs): Promise<INanoServiceResponse> {
		const response: NanoServiceResponse = new NanoServiceResponse();

		try {
			const searchResult = await this.performSemanticSearch(inputs);
			response.setSuccess(searchResult as unknown as JsonLikeObject);
		} catch (error: unknown) {
			const nodeError: GlobalError = new GlobalError((error as Error).message);
			nodeError.setCode(500);
			nodeError.setStack((error as Error).stack);
			nodeError.setName(this.name);
			response.setError(nodeError);
		}

		return response;
	}

	private async performSemanticSearch(inputs: AiSemanticSearchInputs): Promise<SemanticSearchResponse> {
		const client = await this.getDbClient();
		const limit = inputs.limit || 10;

		try {
			// Analyze the query to extract intent and keywords
			const queryAnalysis = this.analyzeQuery(inputs.query);
			
			// Build search query with intelligent keyword matching and ranking
			let searchQuery = `
				SELECT DISTINCT 
					w.id as workflow_id,
					w.name,
					w.description,
					w.category,
					w.tags,
					w.created_by,
					w.is_public,
					(
						-- Relevance scoring based on multiple factors
						CASE 
							WHEN LOWER(w.name) LIKE $1 THEN 10
							WHEN LOWER(w.description) LIKE $1 THEN 8
							WHEN LOWER(w.category) LIKE $1 THEN 6
							ELSE 0
						END +
						-- Tag matching bonus
						CASE 
							WHEN EXISTS (
								SELECT 1 FROM unnest(w.tags) as tag 
								WHERE LOWER(tag) LIKE $1
							) THEN 5
							ELSE 0
						END +
						-- Keyword density scoring
						(
							SELECT COALESCE(SUM(
								CASE 
									WHEN LOWER(w.name) LIKE '%' || LOWER(keyword) || '%' THEN 3
									WHEN LOWER(w.description) LIKE '%' || LOWER(keyword) || '%' THEN 2
									WHEN LOWER(w.category) LIKE '%' || LOWER(keyword) || '%' THEN 1
									ELSE 0
								END
							), 0)
							FROM unnest($4::text[]) as keyword
						)
					) as relevance_score
				FROM workflows w
				WHERE 
					(w.is_public = true OR w.created_by = $2)
					AND (
						LOWER(w.name) LIKE $1 
						OR LOWER(w.description) LIKE $1
						OR LOWER(w.category) LIKE $1
						OR EXISTS (
							SELECT 1 FROM unnest(w.tags) as tag 
							WHERE LOWER(tag) LIKE $1
						)
						OR EXISTS (
							SELECT 1 FROM unnest($4::text[]) as keyword
							WHERE LOWER(w.name) LIKE '%' || LOWER(keyword) || '%'
							   OR LOWER(w.description) LIKE '%' || LOWER(keyword) || '%'
							   OR LOWER(w.category) LIKE '%' || LOWER(keyword) || '%'
						)
					)
			`;

			const queryParams: unknown[] = [
				`%${inputs.query.toLowerCase()}%`,
				inputs.user?.username || '',
				inputs.query.toLowerCase(),
				queryAnalysis.keywords
			];

			// Add filters
			let paramIndex = 5;
			if (inputs.filters?.category) {
				searchQuery += ` AND LOWER(w.category) = $${paramIndex}`;
				queryParams.push(inputs.filters.category.toLowerCase());
				paramIndex++;
			}

			if (inputs.filters?.isPublic !== undefined) {
				searchQuery += ` AND w.is_public = $${paramIndex}`;
				queryParams.push(inputs.filters.isPublic);
				paramIndex++;
			}

			if (inputs.filters?.createdBy) {
				searchQuery += ` AND w.created_by = $${paramIndex}`;
				queryParams.push(inputs.filters.createdBy);
				paramIndex++;
			}

			if (inputs.filters?.tags && inputs.filters.tags.length > 0) {
				searchQuery += ` AND w.tags && $${paramIndex}::text[]`;
				queryParams.push(inputs.filters.tags);
				paramIndex++;
			}

			// Order by relevance and limit
			searchQuery += ` 
				HAVING (
					CASE 
						WHEN LOWER(w.name) LIKE $1 THEN 10
						WHEN LOWER(w.description) LIKE $1 THEN 8
						WHEN LOWER(w.category) LIKE $1 THEN 6
						ELSE 0
					END +
					CASE 
						WHEN EXISTS (
							SELECT 1 FROM unnest(w.tags) as tag 
							WHERE LOWER(tag) LIKE $1
						) THEN 5
						ELSE 0
					END +
					(
						SELECT COALESCE(SUM(
							CASE 
								WHEN LOWER(w.name) LIKE '%' || LOWER(keyword) || '%' THEN 3
								WHEN LOWER(w.description) LIKE '%' || LOWER(keyword) || '%' THEN 2
								WHEN LOWER(w.category) LIKE '%' || LOWER(keyword) || '%' THEN 1
								ELSE 0
							END
						), 0)
						FROM unnest($4::text[]) as keyword
					)
				) > 0
				ORDER BY relevance_score DESC, w.created_at DESC
				LIMIT $${paramIndex}
			`;
			queryParams.push(limit);

			const result = await client.query(searchQuery, queryParams);

			// Generate match reasons for each result
			const results = result.rows.map(row => ({
				...row,
				relevance_score: parseFloat(row.relevance_score),
				match_reason: this.generateMatchReason(row, inputs.query, queryAnalysis.keywords)
			}));

			return {
				success: true,
				results,
				total_count: results.length,
				query_analysis: queryAnalysis
			};

		} finally {
			await client.end();
		}
	}

	private analyzeQuery(query: string): {
		intent: string;
		keywords: string[];
		category_suggestions: string[];
	} {
		const lowerQuery = query.toLowerCase();
		const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
		
		// Determine intent
		let intent = 'search';
		if (lowerQuery.includes('notification') || lowerQuery.includes('alert') || lowerQuery.includes('notify')) {
			intent = 'notification';
		} else if (lowerQuery.includes('data') || lowerQuery.includes('process') || lowerQuery.includes('transform')) {
			intent = 'data-processing';
		} else if (lowerQuery.includes('api') || lowerQuery.includes('integration') || lowerQuery.includes('sync')) {
			intent = 'integration';
		} else if (lowerQuery.includes('email') || lowerQuery.includes('mail')) {
			intent = 'email';
		} else if (lowerQuery.includes('slack') || lowerQuery.includes('chat')) {
			intent = 'chat';
		}

		// Extract meaningful keywords (filter out common words)
		const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'who'];
		const keywords = words.filter(word => !stopWords.includes(word));

		// Suggest categories based on keywords
		const category_suggestions: string[] = [];
		if (keywords.some(k => ['slack', 'notification', 'alert', 'notify', 'message'].includes(k))) {
			category_suggestions.push('notification');
		}
		if (keywords.some(k => ['data', 'csv', 'process', 'transform', 'analytics'].includes(k))) {
			category_suggestions.push('data-processing');
		}
		if (keywords.some(k => ['api', 'integration', 'sync', 'webhook'].includes(k))) {
			category_suggestions.push('integration');
		}
		if (keywords.some(k => ['email', 'mail', 'smtp'].includes(k))) {
			category_suggestions.push('communication');
		}
		if (keywords.some(k => ['automation', 'workflow', 'process'].includes(k))) {
			category_suggestions.push('automation');
		}

		return {
			intent,
			keywords,
			category_suggestions
		};
	}

	private generateMatchReason(row: Record<string, unknown>, originalQuery: string, keywords: string[]): string {
		const reasons: string[] = [];
		const query = originalQuery.toLowerCase();
		
		// Check direct matches
		if ((row.name as string).toLowerCase().includes(query)) {
			reasons.push('Title contains your search term');
		}
		if ((row.description as string).toLowerCase().includes(query)) {
			reasons.push('Description matches your query');
		}
		if ((row.category as string).toLowerCase().includes(query)) {
			reasons.push('Category matches your search');
		}

		// Check tag matches
		const tags = row.tags as string[];
		const matchingTags = tags.filter(tag => 
			tag.toLowerCase().includes(query) || 
			keywords.some(keyword => tag.toLowerCase().includes(keyword))
		);
		if (matchingTags.length > 0) {
			reasons.push(`Tagged with: ${matchingTags.join(', ')}`);
		}

		// Check keyword matches
		const keywordMatches = keywords.filter(keyword => 
			(row.name as string).toLowerCase().includes(keyword) ||
			(row.description as string).toLowerCase().includes(keyword)
		);
		if (keywordMatches.length > 0) {
			reasons.push(`Contains keywords: ${keywordMatches.join(', ')}`);
		}

		return reasons.length > 0 ? reasons.join(' • ') : 'General relevance to your search';
	}

	private async getDbClient() {
		const client = new pg.Client({
			host: process.env.DB_HOST || "localhost",
			port: parseInt(process.env.DB_PORT || "5432"),
			database: process.env.DB_NAME || "blok_platform",
			user: process.env.DB_USER || "postgres",
			password: process.env.DB_PASSWORD || "password",
		});

		await client.connect();
		return client;
	}
} 