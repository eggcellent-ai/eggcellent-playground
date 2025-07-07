import { type UploadedImage } from '../components/InputComponent'
import { type ChatMessage } from './aiService'

export interface TableRow {
	id: string
	input: string
	images?: UploadedImage[]
	responses: Record<string, string>
}

export interface InputRow {
	id: string
	input: string
	images?: UploadedImage[]
}

export interface Model {
	id: string
	name: string
	provider: string
}

export interface Prompt {
	id: string
	inputRows: InputRow[]
	versions: Array<{
		versionId: string
		title: string
	}>
}

// Validates table data and selected models
export const getTableValidation = (
	tableData: TableRow[],
	selectedModels: string[],
	hasValidKeyForModel: (modelId: string) => boolean,
	AVAILABLE_MODELS: readonly Model[]
) => {
	const validationMessages: string[] = []

	// Check if there are any input rows
	if (!tableData || tableData.length === 0) {
		validationMessages.push('No input rows available')
	} else {
		// Check if any rows have content
		const rowsWithContent = tableData.filter(
			(row) => row.input.trim() || (row.images || []).length > 0
		)

		if (rowsWithContent.length === 0) {
			validationMessages.push('All input rows are empty')
		}
	}

	// Check if any models are selected
	if (selectedModels.length === 0) {
		validationMessages.push('No models selected')
	}

	// Check if selected models have valid API keys
	const modelsWithoutKeys = selectedModels.filter(
		(modelId) => !hasValidKeyForModel(modelId)
	)
	if (modelsWithoutKeys.length > 0) {
		const modelNames = modelsWithoutKeys
			.map((modelId) => {
				const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
				return model?.name || modelId
			})
			.join(', ')
		validationMessages.push(`Missing API keys for: ${modelNames}`)
	}

	return {
		isValid: validationMessages.length === 0,
		messages: validationMessages,
	}
}

// Loads current data to JSON format
export const loadCurrentDataToJson = (
	activePromptId: string,
	prompts: Prompt[]
) => {
	if (!activePromptId) return ''

	// Get current input rows and convert to JSON
	const currentPrompt = prompts.find((p) => p.id === activePromptId)
	const inputRows = currentPrompt?.inputRows || []

	// Convert to simple array of strings/objects
	const jsonData = inputRows
		.filter((row) => row.input.trim() || (row.images || []).length > 0) // Only include rows with content
		.map((row) => {
			// If row has images, create an object with both input and images info
			const images = row.images || []
			if (images.length > 0) {
				return {
					input: row.input,
					images: images.length + ' image(s)', // Simplified representation
				}
			}
			// If only text input, return just the string
			return row.input
		})

	// If no existing data, return hello
	if (jsonData.length === 0) {
		return JSON.stringify(['hello'], null, 2)
	}

	return JSON.stringify(jsonData, null, 2)
}

// Validates JSON input format
export const validateJsonInput = (value: string) => {
	const trimmedValue = value.trim()

	if (!trimmedValue) {
		return {
			isValid: true,
			message: '',
			isEmpty: true,
		}
	}

	try {
		const parsed = JSON.parse(trimmedValue)

		// Check if it's a valid format we can process
		if (Array.isArray(parsed)) {
			if (parsed.length === 0) {
				return {
					isValid: true,
					message: '',
					isEmpty: true,
				}
			} else {
				return {
					isValid: true,
					message: `Valid - ${parsed.length} rows detected`,
					isEmpty: false,
				}
			}
		} else if (typeof parsed === 'object' && parsed !== null) {
			// Check for array properties
			const arrayProps = ['items', 'data', 'inputs', 'messages', 'content']
			const foundArrayProp = arrayProps.find((prop) =>
				Array.isArray(parsed[prop])
			)

			if (foundArrayProp) {
				const arrayLength = parsed[foundArrayProp].length
				if (arrayLength === 0) {
					return {
						isValid: true,
						message: '',
						isEmpty: true,
					}
				} else {
					return {
						isValid: true,
						message: `Valid - ${arrayLength} rows detected`,
						isEmpty: false,
					}
				}
			} else {
				// Count non-null values
				const values = Object.values(parsed).filter(
					(val) =>
						typeof val === 'string' ||
						typeof val === 'number' ||
						(typeof val === 'object' && val !== null)
				)
				if (values.length > 0) {
					return {
						isValid: true,
						message: `Valid JSON - Will create ${values.length} row(s) from object values`,
						isEmpty: false,
					}
				} else {
					return {
						isValid: true,
						message: 'Valid JSON - No processable values found',
						isEmpty: false,
					}
				}
			}
		} else {
			return {
				isValid: false,
				message: 'Invalid - must be array or object',
				isEmpty: false,
			}
		}
	} catch {
		return {
			isValid: false,
			message: 'Invalid - JSON format error',
			isEmpty: false,
		}
	}
}

// Detects variable formats in prompt content
export const getVariableFormats = (
	variableName: string,
	promptContent: string
): string[] => {
	const formats: string[] = []

	// Check for {{variable}} format
	const curlyBracePattern = new RegExp(
		`\\{\\{\\s*${variableName.replace(
			/[.*+?^${}()|[\]\\]/g,
			'\\$&'
		)}\\s*\\}\\}`,
		'g'
	)
	if (curlyBracePattern.test(promptContent)) {
		formats.push(`{{${variableName}}}`)
	}

	// Check for ${variable} format
	const dollarBracePattern = new RegExp(
		`\\$\\{\\s*${variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}`,
		'g'
	)
	if (dollarBracePattern.test(promptContent)) {
		formats.push(`\${${variableName}}`)
	}

	return formats
}

// Builds messages array for AI service
export const buildAIServiceMessages = (
	input: string,
	images: UploadedImage[] = [],
	activePromptId: string,
	activeVersionId: string,
	inputPromptContent: string,
	substituteVariables: (
		activePromptId: string,
		activeVersionId: string,
		content: string
	) => string
): ChatMessage[] => {
	const messages: ChatMessage[] = [
		{
			role: 'system',
			content: substituteVariables(
				activePromptId,
				activeVersionId,
				inputPromptContent
			),
		},
	]

	// Build user message content
	if (images.length > 0) {
		// Multimodal content
		const content: Array<
			{ type: 'text'; text: string } | { type: 'image'; image: string }
		> = []

		if (input.trim()) {
			content.push({
				type: 'text',
				text: input.trim(),
			})
		}

		images.forEach((image) => {
			content.push({
				type: 'image',
				image: image.base64,
			})
		})

		messages.push({
			role: 'user',
			content,
		})
	} else {
		// Text-only content
		messages.push({
			role: 'user',
			content: input.trim(),
		})
	}

	return messages
}
