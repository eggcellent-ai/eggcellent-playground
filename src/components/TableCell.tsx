import { useEffect, useState } from 'react'
import { useSystemPromptStore, AVAILABLE_MODELS } from '../lib/stores'
import type { UploadedImage } from './InputComponent'
import { useAIService, type ChatMessage } from '../lib/aiService'
import ModelItem from './ModelItem'
import {
	PlayIcon,
	XMarkIcon,
	ArrowsPointingOutIcon,
} from '@heroicons/react/24/solid'

interface TableCellProps {
	rowId: string
	modelId: string
	input: string
	images?: UploadedImage[]
	systemPrompt: string
	activePromptId: string | null
	activeVersionId: string | null
	isFullScreen?: boolean
}

export default function TableCell({
	rowId,
	modelId,
	input,
	images = [],
	systemPrompt,
	activePromptId,
	activeVersionId,
	isFullScreen = false,
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
				if (existingResponse === '<loading>') {
					setResponse('')
					setIsLoading(true)
					setHasRun(false)
				} else {
					setResponse(existingResponse)
					setIsLoading(false)
					setHasRun(true)
				}
			} else {
				setResponse('')
				setIsLoading(false)
				setHasRun(false)
			}
		}
	}, [activePromptId, activeVersionId, rowId, modelId, getTableCellResponse])

	const handleRun = async () => {
		// Allow if there's either text input or images
		const hasContent = input.trim() || images.length > 0
		if (!hasContent || isLoading) return

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
			<div
				className={`flex flex-col justify-between group w-full ${
					isFullScreen ? 'h-96' : 'h-64'
				}`}
			>
				{/* Response Area - Fixed height with scrolling */}
				<div
					className={`flex-1 overflow-y-auto min-h-0 break-words ${
						isFullScreen ? 'text-base' : 'text-sm'
					}`}
				>
					{isLoading ? (
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
				<div className="flex justify-between items-center bg-neutral-hover/50 transition-opacity duration-200 flex-wrap gap-1 p-2">
					<div className="flex space-x-2">
						<button
							onClick={handleRun}
							disabled={isLoading}
							className={`p-2 text-neutral-700 hover:border hover:border-neutral-300 hover:bg-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
								isFullScreen ? 'text-sm' : 'text-xs'
							}`}
							title={isLoading ? 'Running...' : 'Run'}
						>
							<PlayIcon className="w-4 h-4" />
						</button>
						{hasRun && (
							<button
								onClick={handleClear}
								className={`p-2 text-neutral-700 hover:border hover:border-neutral-300 hover:bg-white rounded-full transition-all ${
									isFullScreen ? 'text-sm' : 'text-xs'
								}`}
								title="Clear"
							>
								<XMarkIcon className="w-4 h-4" />
							</button>
						)}
					</div>

					{/* View Full button - only show if we have content and not in full screen */}
					{response && !isLoading && (
						<button
							onClick={() => setShowFullModal(true)}
							className="p-2 text-neutral-700 hover:border hover:border-neutral-300 hover:bg-white rounded-full transition-all"
							title="View Full Response"
						>
							<ArrowsPointingOutIcon className="w-4 h-4" />
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
						className="bg-white shadow-lg max-w-4xl max-h-[90vh] w-full flex flex-col"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div className="flex justify-between items-center border border-neutral bg-neutral">
							<div className="flex-1">
								{(() => {
									const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
									return model ? (
										<ModelItem
											model={model}
											showStatus
											hasValidKey={hasValidKeyForModel(modelId)}
											className="h-16 p-2 bg-white"
										/>
									) : (
										<h3 className="text-lg font-medium text-text-primary">
											Response - {modelId}
										</h3>
									)
								})()}
							</div>
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
