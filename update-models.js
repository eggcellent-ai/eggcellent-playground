import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read the models.json file
const modelsPath = path.join(__dirname, 'src', 'lib', 'models.json')
const modelsData = JSON.parse(fs.readFileSync(modelsPath, 'utf8'))

// Comprehensive model capabilities mapping based on AI SDK provider support table
const modelCapabilities = {
	// OpenAI models
	'gpt-4o': {
		supportsImageInput: true,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	'gpt-4o-mini': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	'gpt-4-turbo': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	'gpt-3.5-turbo': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	o1: {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	'o1-mini': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	'o1-preview': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},

	// Anthropic models
	'claude-3-7-sonnet-20250219': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	'claude-3-5-sonnet-20241022': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	'claude-3-5-sonnet-20240620': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	'claude-3-5-haiku-20241022': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},

	// xAI Grok models
	'grok-3': {
		supportsImageInput: false,
		supportsObjectGeneration: false,
		supportsToolUsage: false,
		supportsToolStreaming: false,
	},
	'grok-3-fast': {
		supportsImageInput: false,
		supportsObjectGeneration: false,
		supportsToolUsage: false,
		supportsToolStreaming: false,
	},
	'grok-3-mini': {
		supportsImageInput: false,
		supportsObjectGeneration: false,
		supportsToolUsage: false,
		supportsToolStreaming: false,
	},
	'grok-3-mini-fast': {
		supportsImageInput: false,
		supportsObjectGeneration: false,
		supportsToolUsage: false,
		supportsToolStreaming: false,
	},
	'grok-2-1212': {
		supportsImageInput: false,
		supportsObjectGeneration: false,
		supportsToolUsage: false,
		supportsToolStreaming: false,
	},
	'grok-2-vision-1212': {
		supportsImageInput: false,
		supportsObjectGeneration: false,
		supportsToolUsage: false,
		supportsToolStreaming: false,
	},
	'grok-beta': {
		supportsImageInput: false,
		supportsObjectGeneration: false,
		supportsToolUsage: false,
		supportsToolStreaming: false,
	},
	'grok-vision-beta': {
		supportsImageInput: false,
		supportsObjectGeneration: false,
		supportsToolUsage: false,
		supportsToolStreaming: false,
	},

	// Google models
	'gemini-2.0-flash-exp': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	'gemini-1.5-flash': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},
	'gemini-1.5-pro': {
		supportsImageInput: false,
		supportsObjectGeneration: true,
		supportsToolUsage: true,
		supportsToolStreaming: true,
	},

	// Additional models that might be in your JSON but not in the AI SDK table
	// These will default to false unless specified above
}

// Update each model with capabilities from the mapping
modelsData.models.forEach((model) => {
	const caps = modelCapabilities[model.id] || {
		supportsImageInput: false,
		supportsObjectGeneration: false,
		supportsToolUsage: false,
		supportsToolStreaming: false,
	}
	Object.assign(model, caps)
})

// Write the updated data back to the file
fs.writeFileSync(modelsPath, JSON.stringify(modelsData, null, '\t'))

console.log(
	'Successfully updated models.json with accurate AI SDK capabilities based on provider support table'
)
