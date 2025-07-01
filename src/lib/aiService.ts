import { useState, useCallback, useMemo } from 'react'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText, generateText } from 'ai'
import type { CoreMessage } from 'ai'
import { useApiKeyStore } from './stores'

export type ChatMessage = CoreMessage

// Model provider mapping
const getModelProvider = (modelId: string): string => {
	if (modelId.startsWith('gpt-') || modelId.startsWith('o1-')) return 'openai'
	if (modelId.startsWith('claude-')) return 'anthropic'

	// For now, we'll support the most reliable providers
	// More providers can be added as the AI SDK stabilizes their APIs
	return 'openai' // Default fallback
}

// React hook for AI service using proper AI SDK
export function useAIService() {
	const { openaiKey, anthropicKey, getKeyForProvider } = useApiKeyStore()

	// Create AI providers with user's API keys
	const providers = useMemo(() => {
		return {
			openai: openaiKey ? createOpenAI({ apiKey: openaiKey }) : null,
			anthropic: anthropicKey
				? createAnthropic({ apiKey: anthropicKey })
				: null,
		}
	}, [openaiKey, anthropicKey])

	const hasValidKeyForModel = useCallback(
		(modelId: string): boolean => {
			const provider = getModelProvider(modelId)
			const key = getKeyForProvider(provider)
			return Boolean(key && key.trim())
		},
		[getKeyForProvider]
	)

	const getProviderAndModel = useCallback(
		(modelId: string) => {
			const providerName = getModelProvider(modelId)
			const provider = providers[providerName as keyof typeof providers]

			if (!provider) {
				throw new Error(
					`Provider ${providerName} not available or API key missing`
				)
			}

			return { provider, providerName }
		},
		[providers]
	)

	const generateAIText = useCallback(
		async (messages: ChatMessage[], modelId: string): Promise<string> => {
			const { provider, providerName } = getProviderAndModel(modelId)

			try {
				const result = await generateText({
					model: provider(modelId),
					messages,
				})
				return result.text
			} catch (error) {
				console.error(`Error with ${providerName} provider:`, error)
				throw new Error(
					`Failed to generate text with ${providerName}: ${
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
		): Promise<string> => {
			const { provider, providerName } = getProviderAndModel(modelId)

			try {
				const result = streamText({
					model: provider(modelId),
					messages,
				})

				let fullText = ''
				for await (const textPart of result.textStream) {
					fullText += textPart
					if (onUpdate) {
						onUpdate(fullText)
					}
				}
				return fullText
			} catch (error) {
				console.error(`Error with ${providerName} provider:`, error)
				throw new Error(
					`Failed to stream text with ${providerName}: ${
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
		providers,
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
				setCompletion(result)
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
