import { useEffect, useState } from 'react'
import { useSystemPromptStore } from '../lib/stores'
import type { UploadedImage } from './InputComponent'
import { useAIService, type ChatMessage } from '../lib/aiService'

interface TableCellProps {
	rowId: string
	modelId: string
	input: string
	images?: UploadedImage[]
	systemPrompt: string
	activePromptId: string | null
	activeVersionId: string | null
	isRowRunning?: boolean
}

export default function TableCell({
	rowId,
	modelId,
	input,
	images = [],
	systemPrompt,
	activePromptId,
	activeVersionId,
	isRowRunning = false,
}: TableCellProps) {
	const [response, setResponse] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [hasRun, setHasRun] = useState(false)
	const [showFullModal, setShowFullModal] = useState(false)

	const { getTableCellResponse, updateTableCellResponse } =
		useSystemPromptStore()

	const { streamText, hasValidKeyForModel } = useAIService()

	// Load existing response
	useEffect(() => {
		if (activePromptId && activeVersionId) {
			const existingResponse = getTableCellResponse(
				activePromptId,
				activeVersionId,
				rowId,
				modelId
			)
			if (existingResponse) {
				setResponse(existingResponse)
				setHasRun(true)
			} else {
				setResponse('')
				setHasRun(false)
			}
		}
	}, [activePromptId, activeVersionId, rowId, modelId, getTableCellResponse])

	const handleRun = async () => {
		// Allow if there's either text input or images
		const hasContent = input.trim() || images.length > 0
		if (!hasContent || isLoading || isRowRunning) return

		// Check if we have a valid API key for this model
		if (!hasValidKeyForModel(modelId)) {
			setResponse('Error: API key required for this model')
			setHasRun(true)
			return
		}

		setIsLoading(true)
		setResponse('')
		setHasRun(false)

		try {
			// Build messages array for AI service
			const messages: ChatMessage[] = [
				{
					role: 'system',
					content: systemPrompt,
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

			// Use streaming AI service
			const fullResponse = await streamText(messages, modelId, (text) =>
				setResponse(text)
			)

			// Save response to store
			if (activePromptId && activeVersionId) {
				updateTableCellResponse(
					activePromptId,
					activeVersionId,
					rowId,
					modelId,
					fullResponse
				)
			}

			setHasRun(true)
		} catch (error) {
			console.error('Error:', error)
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to get response'
			setResponse(`Error: ${errorMessage}`)
			setHasRun(true)
		} finally {
			setIsLoading(false)
		}
	}

	const handleClear = () => {
		setResponse('')
		setHasRun(false)
		if (activePromptId && activeVersionId) {
			updateTableCellResponse(
				activePromptId,
				activeVersionId,
				rowId,
				modelId,
				''
			)
		}
	}

	return (
		<>
			<div className="flex flex-col h-64 justify-between group w-full max-w-[300px]">
				{/* Response Area - Fixed height with scrolling */}
				<div className="flex-1 overflow-y-auto text-sm min-h-0 break-words">
					{isLoading || isRowRunning ? (
						<div className="animate-pulse text-muted">Running prompt...</div>
					) : response ? (
						<div className="whitespace-pre-wrap text-text-primary break-words">
							{response}
						</div>
					) : (
						<div className="text-muted">Click Run to test</div>
					)}
				</div>

				{/* Controls */}
				<div className="flex justify-between items-center p-2 bg-neutral-hover/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-wrap gap-1">
					<div className="flex space-x-2">
						<button
							onClick={handleRun}
							disabled={isLoading || isRowRunning}
							className="px-3 py-1 bg-neutral-900 text-white text-xs hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isLoading || isRowRunning ? 'Running...' : 'Run'}
						</button>
						{hasRun && (
							<button
								onClick={handleClear}
								className="px-3 py-1 border border-neutral text-text-secondary text-xs hover:border-neutral-dark hover:bg-neutral-hover transition-colors"
							>
								Clear
							</button>
						)}
					</div>

					{/* View Full button - only show if we have content */}
					{response && !isLoading && !isRowRunning && (
						<button
							onClick={() => setShowFullModal(true)}
							className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors shrink-0"
						>
							View Full
						</button>
					)}
				</div>
			</div>

			{/* Full Response Modal */}
			{showFullModal && (
				<div
					className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
					onClick={() => setShowFullModal(false)}
				>
					<div
						className="bg-white rounded-lg shadow-lg max-w-4xl max-h-[90vh] w-full flex flex-col"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div className="flex justify-between items-center p-4 border border-neutral bg-neutral">
							<h3 className="text-lg font-medium text-text-primary">
								Full Response - {modelId}
							</h3>
							<button
								onClick={() => setShowFullModal(false)}
								className="text-text-secondary hover:text-text-primary text-xl leading-none"
							>
								×
							</button>
						</div>

						{/* Modal Content */}
						<div className="flex-1 overflow-y-auto p-4">
							<div className="whitespace-pre-wrap text-text-primary text-lg leading-relaxed">
								{response}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
