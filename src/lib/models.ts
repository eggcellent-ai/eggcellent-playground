import modelsData from './models.json'

export interface Model {
	id: string
	name: string
	provider: string

	// Optional metadata for comparison
	contextWindow?: number // in tokens
	inputPricePer1KToken?: number // in USD per 1K input tokens
	outputPricePer1KToken?: number // in USD per 1K output tokens
	latency?: 'low' | 'medium' | 'high'
	quality?: 'low' | 'medium' | 'high'
	strengths?: string[] // e.g., ["chat", "code", "json", "creative"]
	isMultimodal?: boolean // if supports image/audio

	// AI SDK capabilities
	supportsImageInput?: boolean
	supportsObjectGeneration?: boolean
	supportsToolUsage?: boolean
	supportsToolStreaming?: boolean
}

// Available models configuration imported from JSON
export const AVAILABLE_MODELS: Model[] = modelsData.models as Model[]

// Get model pricing - all models now use separate input/output pricing
export function getModelPricing(modelId: string): {
	input: number // price per token for input
	output: number // price per token for output
} {
	// Find model in models.json
	const model = (modelsData.models as Model[]).find((m) => m.id === modelId)
	if (!model) {
		throw new Error(`Unknown model: ${modelId}`)
	}

	// All models should have separate input/output pricing
	if (
		typeof model.inputPricePer1KToken !== 'number' ||
		typeof model.outputPricePer1KToken !== 'number'
	) {
		throw new Error(`Model ${modelId} missing input/output pricing`)
	}

	return {
		input: model.inputPricePer1KToken / 1000,
		output: model.outputPricePer1KToken / 1000,
	}
}
