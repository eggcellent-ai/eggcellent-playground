import modelsData from './models.json'

export interface Model {
	id: string
	name: string
	provider: string

	// Optional metadata for comparison
	contextWindow?: number // in tokens
	pricePer1KToken?: number // in USD
	latency?: 'low' | 'medium' | 'high'
	quality?: 'low' | 'medium' | 'high'
	strengths?: string[] // e.g., ["chat", "code", "json", "creative"]
	isMultimodal?: boolean // if supports image/audio
}

// Available models configuration imported from JSON
export const AVAILABLE_MODELS: Model[] = modelsData.models as Model[]
