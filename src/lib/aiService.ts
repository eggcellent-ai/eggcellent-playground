import { useState, useCallback } from 'react'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createXai } from '@ai-sdk/xai'
import { streamText, generateText } from 'ai'
import type { CoreMessage } from 'ai'
import { useApiKeyStore } from './stores'
import { useAuthStore } from './authStore'
import { ApiService } from './apiService'

export type ChatMessage = CoreMessage

// Model provider mapping - comprehensive detection
const getModelProvider = (modelId: string): string => {
	// OpenAI models
	if (
		modelId.startsWith('gpt-') ||
		modelId.startsWith('o1-') ||
		modelId.startsWith('o3-') ||
		modelId.startsWith('o4-') ||
		modelId === 'o1' ||
		modelId === 'o3' ||
		modelId === 'o4'
	)
		return 'openai'

	// Anthropic models
	if (modelId.startsWith('claude-')) return 'anthropic'

	// xAI models
	if (modelId.startsWith('grok-')) return 'xai'

	// Google models
	if (modelId.startsWith('gemini-')) return 'google'

	// Mistral models
	if (
		modelId.startsWith('mistral-') ||
		modelId.startsWith('open-mistral-') ||
		modelId.startsWith('open-mixtral-')
	)
		return 'mistral'

	// Groq models (fast inference)
	if (
		(modelId.includes('llama') && !modelId.includes('/')) ||
		(modelId.includes('mixtral') && !modelId.includes('/')) ||
		modelId.includes('gemma')
	)
		return 'groq'

	// DeepSeek models
	if (modelId.startsWith('deepseek-')) return 'deepseek'

	// Together.ai models (contain slash in model name)
	if (modelId.includes('/')) return 'togetherai'

	// Perplexity models
	if (modelId.includes('sonar')) return 'perplexity'

	// Default fallback to OpenAI for unknown models
	console.warn(`Unknown model provider for ${modelId}, defaulting to OpenAI`)
	return 'openai'
}

// React hook for AI service using proper AI SDK
export function useAIService() {
	const { openaiKey, anthropicKey, googleKey, xaiKey, getKeyForProvider } =
		useApiKeyStore()

	// Get the appropriate provider/model for a given model ID
	const getProviderModel = useCallback(
		(modelId: string) => {
			const providerName = getModelProvider(modelId)

			switch (providerName) {
				case 'openai':
					if (!openaiKey) throw new Error('OpenAI API key required')
					return createOpenAI({ apiKey: openaiKey })(modelId)

				case 'anthropic':
					if (!anthropicKey) throw new Error('Anthropic API key required')
					return createAnthropic({
						apiKey: anthropicKey,
						headers: {
							'anthropic-dangerous-direct-browser-access': 'true',
						},
					})(modelId)

				case 'google':
					if (!googleKey) throw new Error('Google API key required')
					return createGoogleGenerativeAI({ apiKey: googleKey })(modelId)

				case 'xai':
					if (!xaiKey) throw new Error('xAI API key required')
					return createXai({ apiKey: xaiKey })(modelId)

				default:
					throw new Error(
						`Provider ${providerName} not yet supported. Currently supporting OpenAI, Anthropic, Google, and xAI.`
					)
			}
		},
		[openaiKey, anthropicKey, googleKey, xaiKey]
	)

		const hasValidKeyForModel = useCallback(
		(modelId: string): boolean => {
			// Check if user is logged in AND has credits - if so, they can use backend API
			const { user, hasCredits } = useAuthStore.getState()
			if (user && hasCredits()) {
				return true // Backend API is available for authenticated users with credits
			}
			
			// Fall back to local API key check
			const provider = getModelProvider(modelId)
			const key = getKeyForProvider(provider)
			return Boolean(key && key.trim())
		},
		[getKeyForProvider]
	)

	const getProviderAndModel = useCallback(
		(modelId: string) => {
			const providerName = getModelProvider(modelId)
			try {
				const model = getProviderModel(modelId)
				return { model, providerName }
			} catch (error) {
				throw new Error(
					`Provider ${providerName} not available or API key missing. Error: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`
				)
			}
		},
		[getProviderModel]
	)

	const generateAIText = useCallback(
		async (
			messages: ChatMessage[],
			modelId: string
		): Promise<{
			text: string
			usage?: {
				promptTokens: number
				completionTokens: number
				totalTokens: number
			}
		}> => {
			// Check if user is logged in AND has credits - if so, use backend API
			const { user, hasCredits } = useAuthStore.getState()
			if (user && hasCredits()) {
				try {
					console.log(`Using backend API for model: ${modelId}`)

					// Convert messages to a single prompt string for backend API
					const extractTextContent = (content: unknown): string => {
						if (typeof content === 'string') return content
						if (Array.isArray(content)) {
							return content
								.filter((part): part is {type: string; text: string} => 
									typeof part === 'object' && 
									part !== null && 
									'type' in part && 
									part.type === 'text' &&
									'text' in part &&
									typeof part.text === 'string'
								)
								.map((part) => part.text)
								.join(' ')
						}
						return ''
					}

					const systemMessage = extractTextContent(
						messages.find((m) => m.role === 'system')?.content || ''
					)
					const userMessage = extractTextContent(
						messages.find((m) => m.role === 'user')?.content || ''
					)
					const prompt = systemMessage
						? `${systemMessage}\n\n${userMessage}`
						: userMessage

					const result = await ApiService.callModel(modelId, prompt)

					return {
						text: result.output,
						usage: result.usage,
					}
				} catch (error) {
					console.error(`Backend API error for model ${modelId}:`, error)
					throw new Error(
						`Backend API failed: ${
							error instanceof Error ? error.message : 'Unknown error'
						}`
					)
				}
			}

			// Fall back to local API with user's keys
			const { model, providerName } = getProviderAndModel(modelId)

			try {
				console.log(
					`Generating text with ${providerName} provider for model: ${modelId}`
				)

				const result = await generateText({
					model,
					messages,
				})
				return { text: result.text, usage: result.usage }
			} catch (error) {
				console.error(
					`Error with ${providerName} provider for model ${modelId}:`,
					error
				)
				throw new Error(
					`Failed to generate text with ${providerName} (${modelId}): ${
						error instanceof Error ? error.message : 'Unknown error'
					}`
				)
			}
		},
		[getProviderAndModel]
	)

	const streamAIText = useCallback(
		async (
			messages: ChatMessage[],
			modelId: string,
			onUpdate?: (text: string) => void
		): Promise<{ text: string; duration: number }> => {
			const { model, providerName } = getProviderAndModel(modelId)

			try {
				console.log(
					`Streaming text with ${providerName} provider for model: ${modelId}`
				)

				const startTime = performance.now()
				const result = streamText({
					model,
					messages,
				})

				let fullText = ''
				for await (const textPart of result.textStream) {
					fullText += textPart
					if (onUpdate) {
						onUpdate(fullText)
					}
				}
				const endTime = performance.now()
				const duration = endTime - startTime

				console.log(`${modelId} completed in ${duration}ms`)
				return { text: fullText, duration }
			} catch (error) {
				console.error(
					`Error with ${providerName} provider for model ${modelId}:`,
					error
				)
				throw new Error(
					`Failed to stream text with ${providerName} (${modelId}): ${
						error instanceof Error ? error.message : 'Unknown error'
					}`
				)
			}
		},
		[getProviderAndModel]
	)

	return {
		generateText: generateAIText,
		streamText: streamAIText,
		hasValidKeyForModel,
		getModelProvider, // Export for debugging
		// Legacy compatibility
		openaiKey,
		anthropicKey,
	}
}

// Hook for simple text completion with loading state
export function useAICompletion(modelId: string) {
	const { generateText, hasValidKeyForModel } = useAIService()
	const [completion, setCompletion] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const complete = useCallback(
		async (prompt: string) => {
			if (!hasValidKeyForModel(modelId)) {
				setError(`API key required for ${getModelProvider(modelId)} provider`)
				return
			}

			setIsLoading(true)
			setError(null)

			try {
				const messages: ChatMessage[] = [{ role: 'user', content: prompt }]
				const result = await generateText(messages, modelId)
				setCompletion(result.text)
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to generate completion'
				setError(errorMessage)
			} finally {
				setIsLoading(false)
			}
		},
		[modelId, generateText, hasValidKeyForModel]
	)

	return {
		completion,
		isLoading,
		error,
		complete,
		hasValidKey: hasValidKeyForModel(modelId),
	}
}

// Hook for streaming text with loading state
export function useAIStream(modelId: string) {
	const { streamText, hasValidKeyForModel } = useAIService()
	const [content, setContent] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const stream = useCallback(
		async (messages: ChatMessage[]) => {
			if (!hasValidKeyForModel(modelId)) {
				setError(`API key required for ${getModelProvider(modelId)} provider`)
				return
			}

			setIsLoading(true)
			setError(null)
			setContent('')

			try {
				await streamText(messages, modelId, (text) => {
					setContent(text)
				})
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to stream content'
				setError(errorMessage)
			} finally {
				setIsLoading(false)
			}
		},
		[modelId, streamText, hasValidKeyForModel]
	)

	return {
		content,
		isLoading,
		error,
		stream,
		hasValidKey: hasValidKeyForModel(modelId),
	}
}
