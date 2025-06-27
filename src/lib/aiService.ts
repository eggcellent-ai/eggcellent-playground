import { useState, useCallback, useMemo } from 'react'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText, generateText } from 'ai'
import type { CoreMessage } from 'ai'
import { useApiKeyStore } from './stores'

export type ChatMessage = CoreMessage

// React hook for AI service using proper AI SDK
export function useAIService() {
	const { openaiKey, anthropicKey } = useApiKeyStore()

	// Create AI providers with user's API keys
	const providers = useMemo(() => {
		const openaiProvider = openaiKey
			? createOpenAI({ apiKey: openaiKey })
			: null
		const anthropicProvider = anthropicKey
			? createAnthropic({ apiKey: anthropicKey })
			: null
		return { openaiProvider, anthropicProvider }
	}, [openaiKey, anthropicKey])

	const hasValidKeyForModel = useCallback(
		(modelId: string): boolean => {
			if (modelId.startsWith('gpt-')) {
				return Boolean(openaiKey && openaiKey.trim())
			} else if (modelId.startsWith('claude-')) {
				return Boolean(anthropicKey && anthropicKey.trim())
			}
			return false
		},
		[openaiKey, anthropicKey]
	)

	const generateAIText = useCallback(
		async (messages: ChatMessage[], modelId: string): Promise<string> => {
			if (modelId.startsWith('gpt-')) {
				if (!providers.openaiProvider) {
					throw new Error('OpenAI API key is required for GPT models')
				}
				const result = await generateText({
					model: providers.openaiProvider(modelId),
					messages,
				})
				return result.text
			} else if (modelId.startsWith('claude-')) {
				if (!providers.anthropicProvider) {
					throw new Error('Anthropic API key is required for Claude models')
				}
				const result = await generateText({
					model: providers.anthropicProvider(modelId),
					messages,
				})
				return result.text
			} else {
				throw new Error(`Unsupported model: ${modelId}`)
			}
		},
		[providers]
	)

	const streamAIText = useCallback(
		async (
			messages: ChatMessage[],
			modelId: string,
			onUpdate?: (text: string) => void
		): Promise<string> => {
			if (modelId.startsWith('gpt-')) {
				if (!providers.openaiProvider) {
					throw new Error('OpenAI API key is required for GPT models')
				}
				const result = streamText({
					model: providers.openaiProvider(modelId),
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
			} else if (modelId.startsWith('claude-')) {
				if (!providers.anthropicProvider) {
					throw new Error('Anthropic API key is required for Claude models')
				}
				const result = streamText({
					model: providers.anthropicProvider(modelId),
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
			} else {
				throw new Error(`Unsupported model: ${modelId}`)
			}
		},
		[providers]
	)

	return {
		generateText: generateAIText,
		streamText: streamAIText,
		hasValidKeyForModel,
		openaiKey,
		anthropicKey,
		providers,
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
				setError('API key required for this model')
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
				setError('API key required for this model')
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
