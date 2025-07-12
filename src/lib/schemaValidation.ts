import { z } from 'zod'

export interface SchemaValidationResult {
	isValid: boolean
	errors: string[]
	parsedData?: unknown
	rawResponse: string
}

export interface SchemaValidationConfig {
	schema: string
	strictMode?: boolean
	allowPartial?: boolean
}

// Parse JSON schema string to Zod schema
export function parseJsonSchema(schemaString: string): z.ZodSchema | null {
	try {
		const schemaObj = JSON.parse(schemaString)
		return jsonSchemaToZod(schemaObj)
	} catch (error) {
		console.error('Failed to parse JSON schema:', error)
		return null
	}
}

// Convert JSON Schema to Zod schema (basic implementation)
function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodSchema {
	const schemaObj = schema as {
		type?: string
		properties?: Record<string, Record<string, unknown>>
		required?: string[]
		items?: Record<string, unknown>
		enum?: string[]
		pattern?: string
		minLength?: number
		maxLength?: number
		minimum?: number
		maximum?: number
		oneOf?: Record<string, unknown>[]
		anyOf?: Record<string, unknown>[]
	}

	if (schemaObj.type === 'object') {
		const shape: Record<string, z.ZodSchema> = {}

		if (schemaObj.properties) {
			for (const [key, propSchema] of Object.entries(schemaObj.properties)) {
				shape[key] = jsonSchemaToZod(propSchema)

				// Handle required fields
				if (schemaObj.required && schemaObj.required.includes(key)) {
					// Field is required, keep as is
				} else {
					// Field is optional
					shape[key] = shape[key].optional()
				}
			}
		}

		return z.object(shape)
	}

	if (schemaObj.type === 'array') {
		const itemSchema = schemaObj.items
			? jsonSchemaToZod(schemaObj.items)
			: z.unknown()
		return z.array(itemSchema)
	}

	if (schemaObj.type === 'string') {
		let zodSchema: z.ZodSchema = z.string()

		if (schemaObj.enum && schemaObj.enum.length > 0) {
			zodSchema = z.enum(schemaObj.enum as [string, ...string[]])
		} else {
			if (schemaObj.pattern) {
				zodSchema = (zodSchema as z.ZodString).regex(
					new RegExp(schemaObj.pattern)
				)
			}

			if (schemaObj.minLength !== undefined) {
				zodSchema = (zodSchema as z.ZodString).min(schemaObj.minLength)
			}

			if (schemaObj.maxLength !== undefined) {
				zodSchema = (zodSchema as z.ZodString).max(schemaObj.maxLength)
			}
		}

		return zodSchema
	}

	if (schemaObj.type === 'number' || schemaObj.type === 'integer') {
		let zodSchema = schemaObj.type === 'integer' ? z.number().int() : z.number()

		if (schemaObj.minimum !== undefined) {
			zodSchema = zodSchema.min(schemaObj.minimum)
		}

		if (schemaObj.maximum !== undefined) {
			zodSchema = zodSchema.max(schemaObj.maximum)
		}

		return zodSchema
	}

	if (schemaObj.type === 'boolean') {
		return z.boolean()
	}

	if (schemaObj.type === 'null') {
		return z.null()
	}

	// Handle oneOf, anyOf, allOf
	if (schemaObj.oneOf && schemaObj.oneOf.length > 0) {
		const schemas = schemaObj.oneOf.map((s) => jsonSchemaToZod(s))
		if (schemas.length >= 2) {
			return z.union(schemas as [z.ZodSchema, z.ZodSchema, ...z.ZodSchema[]])
		}
		return schemas[0] || z.unknown()
	}

	if (schemaObj.anyOf && schemaObj.anyOf.length > 0) {
		const schemas = schemaObj.anyOf.map((s) => jsonSchemaToZod(s))
		if (schemas.length >= 2) {
			return z.union(schemas as [z.ZodSchema, z.ZodSchema, ...z.ZodSchema[]])
		}
		return schemas[0] || z.unknown()
	}

	// Default to unknown for unknown types
	return z.unknown()
}

// Extract JSON from AI response
export function extractJsonFromResponse(response: string): string | null {
	// Try to find JSON blocks in the response
	const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/
	const match = response.match(jsonBlockRegex)

	if (match) {
		return match[1]
	}

	// Try to find JSON at the beginning or end of the response
	const trimmedResponse = response.trim()

	// Check if the entire response is JSON
	try {
		JSON.parse(trimmedResponse)
		return trimmedResponse
	} catch {
		// Not valid JSON, continue searching
	}

	// Look for JSON object or array at the end
	const jsonEndRegex = /(\{[\s\S]*\}|\[[\s\S]*\])$/
	const endMatch = trimmedResponse.match(jsonEndRegex)

	if (endMatch) {
		try {
			JSON.parse(endMatch[1])
			return endMatch[1]
		} catch {
			// Not valid JSON
		}
	}

	// Look for JSON object or array at the beginning
	const jsonStartRegex = /^(\{[\s\S]*\}|\[[\s\S]*\])/
	const startMatch = trimmedResponse.match(jsonStartRegex)

	if (startMatch) {
		try {
			JSON.parse(startMatch[1])
			return startMatch[1]
		} catch {
			// Not valid JSON
		}
	}

	return null
}

// Validate AI response against JSON schema
export function validateResponseAgainstSchema(
	response: string,
	schemaConfig: SchemaValidationConfig
): SchemaValidationResult {
	const result: SchemaValidationResult = {
		isValid: false,
		errors: [],
		rawResponse: response,
	}

	// Parse the schema
	const zodSchema = parseJsonSchema(schemaConfig.schema)
	if (!zodSchema) {
		result.errors.push('Invalid JSON schema format')
		return result
	}

	// Extract JSON from response
	const jsonString = extractJsonFromResponse(response)
	if (!jsonString) {
		result.errors.push('No valid JSON found in response')
		return result
	}

	// Parse the JSON
	let parsedData: unknown
	try {
		parsedData = JSON.parse(jsonString)
	} catch (error) {
		result.errors.push(
			`Invalid JSON format: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		)
		return result
	}

	// Validate against schema
	try {
		const validatedData = zodSchema.parse(parsedData)
		result.isValid = true
		result.parsedData = validatedData
	} catch (error) {
		if (error instanceof z.ZodError) {
			result.errors = error.errors.map((err) => {
				const path = err.path.join('.')
				return `${path}: ${err.message}`
			})
		} else {
			result.errors.push(
				`Validation error: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			)
		}
	}

	return result
}

// Generate example schema based on common use cases
export function generateExampleSchema(
	type: 'user' | 'product' | 'article' | 'custom'
): string {
	const schemas = {
		user: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' },
				email: { type: 'string' },
				age: { type: 'integer', minimum: 0 },
				isActive: { type: 'boolean' },
			},
			required: ['id', 'name', 'email'],
		},
		product: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' },
				price: { type: 'number', minimum: 0 },
				category: { type: 'string' },
				tags: { type: 'array', items: { type: 'string' } },
				inStock: { type: 'boolean' },
			},
			required: ['id', 'name', 'price'],
		},
		article: {
			type: 'object',
			properties: {
				title: { type: 'string' },
				content: { type: 'string' },
				author: { type: 'string' },
				publishDate: { type: 'string' },
				tags: { type: 'array', items: { type: 'string' } },
				readTime: { type: 'integer', minimum: 1 },
			},
			required: ['title', 'content', 'author'],
		},
		custom: {
			type: 'object',
			properties: {
				message: { type: 'string' },
				status: { type: 'string', enum: ['success', 'error', 'pending'] },
				data: { type: 'object' },
			},
			required: ['message', 'status'],
		},
	}

	return JSON.stringify(schemas[type], null, 2)
}
