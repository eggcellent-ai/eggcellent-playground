import { useEffect, useState } from 'react'
import { useSystemPromptStore, AVAILABLE_MODELS } from '../lib/stores'
import { useAIService, type ChatMessage } from '../lib/aiService'
import { validateResponseAgainstSchema } from '../lib/schemaValidation'
import ModelItem from './ModelItem'
import {
	PlayIcon,
	XMarkIcon,
	ArrowsPointingOutIcon,
	CheckIcon,
} from '@heroicons/react/24/solid'

import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'

interface TableCellProps {
	rowId: string
	modelId: string
	input: string
	systemPrompt: string
	activePromptId: string | null
	activeVersionId: string | null
	isFullScreen?: boolean
}

export default function TableCell({
	rowId,
	modelId,
	input,
	systemPrompt,
	activePromptId,
	activeVersionId,
	isFullScreen = false,
}: TableCellProps) {
	const [response, setResponse] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [hasRun, setHasRun] = useState(false)
	const [showFullModal, setShowFullModal] = useState(false)
	const [duration, setDuration] = useState<number | null>(null)
	const [isCopied, setIsCopied] = useState(false)
	const [validationResult, setValidationResult] = useState<{
		isValid: boolean
		errors: string[]
		parsedData?: unknown
	} | null>(null)

	const {
		getTableCellResponse,
		updateTableCellResponse,
		getOutputSchema,
		getSchemaValidationResult,
		updateSchemaValidationResult,
	} = useSystemPromptStore()

	const { streamText, hasValidKeyForModel } = useAIService()

	// Load existing response and validation result
	useEffect(() => {
		if (activePromptId && activeVersionId) {
			const existingResponse = getTableCellResponse(
				activePromptId,
				activeVersionId,
				rowId,
				modelId
			)
			const existingValidation = getSchemaValidationResult(
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
					setDuration(null)
					setValidationResult(null)
				} else {
					// Check if response includes timing data
					const parts = existingResponse.split('__TIMING__')
					if (parts.length > 1) {
						setResponse(parts[0])
						setDuration(parseFloat(parts[1]))
					} else {
						setResponse(existingResponse)
						setDuration(null)
					}
					setIsLoading(false)
					setHasRun(true)
					setValidationResult(existingValidation || null)
				}
			} else {
				setResponse('')
				setIsLoading(false)
				setHasRun(false)
				setDuration(null)
				setValidationResult(null)
			}
		}
	}, [
		activePromptId,
		activeVersionId,
		rowId,
		modelId,
		getTableCellResponse,
		getSchemaValidationResult,
	])

	const handleRun = async () => {
		// Allow if there's text input
		const hasContent = input.trim()
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
		setDuration(null)

		try {
			// Build messages array for AI service
			const messages: ChatMessage[] = [
				{
					role: 'system',
					content: systemPrompt,
				},
				{
					role: 'user',
					content: input.trim(),
				},
			]

			// Use streaming AI service
			const { text: fullResponse, duration: responseDuration } =
				await streamText(messages, modelId, (text) => setResponse(text))

			setDuration(responseDuration)

			// Save response to store with timing data
			if (activePromptId && activeVersionId) {
				updateTableCellResponse(
					activePromptId,
					activeVersionId,
					rowId,
					modelId,
					`${fullResponse}__TIMING__${responseDuration}`
				)

				// Validate response against schema if one exists
				const schema = getOutputSchema(activePromptId, activeVersionId)
				if (schema) {
					const validation = validateResponseAgainstSchema(fullResponse, {
						schema,
					})
					setValidationResult(validation)
					updateSchemaValidationResult(
						activePromptId,
						activeVersionId,
						rowId,
						modelId,
						validation
					)
				}
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

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(response)
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 2000) // Reset after 2 seconds
		} catch (err) {
			console.error('Failed to copy text:', err)
		}
	}

	return (
		<>
			<div
				className={`flex flex-col justify-between group w-full relative ${
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
						<div className="animate-pulse text-muted p-2">
							Running prompt...
						</div>
					) : response ? (
						<div>
							{duration !== null && (
								<div
									className={`absolute bottom-0 left-0 text-xs text-secondary p-2 w-full text-right flex justify-between items-end ${
										validationResult?.isValid
											? 'bg-green-50'
											: validationResult
											? 'bg-red-50'
											: 'bg-surface-card'
									}`}
								>
									{/* Validation Status */}
									{validationResult && (
										<div
											className={`text-xs ${
												validationResult.isValid
													? 'text-success-dark'
													: 'text-error-dark'
											}`}
										>
											{isFullScreen ? (
												<>
													<div className="flex items-center gap-1">
														{validationResult.isValid ? (
															<CheckIcon className="w-3 h-3" />
														) : (
															<XMarkIcon className="w-3 h-3" />
														)}
														<span className="font-medium">
															{validationResult.isValid ? 'Valid' : 'Invalid'}{' '}
															Schema
														</span>
													</div>
													{!validationResult.isValid &&
														validationResult.errors.length > 0 && (
															<div className="text-xs">
																{validationResult.errors
																	.slice(0, 2)
																	.map((error, index) => (
																		<div
																			key={index}
																			className="text-error-dark"
																		>
																			• {error}
																		</div>
																	))}
																{validationResult.errors.length > 2 && (
																	<div className="text-error-dark">
																		• ...and{' '}
																		{validationResult.errors.length - 2} more
																		errors
																	</div>
																)}
															</div>
														)}
												</>
											) : (
												<div className="flex items-center justify-center">
													{validationResult.isValid ? (
														<CheckIcon
															className="w-4 h-4 text-success"
															title="Valid Schema"
														/>
													) : (
														<XMarkIcon
															className="w-4 h-4 text-error"
															title={`Invalid Schema - ${validationResult.errors.length} error(s)`}
														/>
													)}
												</div>
											)}
										</div>
									)}
									Response time: {(duration / 1000).toFixed(2)}s
								</div>
							)}

							<div className="pb-10 whitespace-pre-wrap text-primary break-words p-2">
								{response}
							</div>
						</div>
					) : (
						<div className="text-muted p-2">Click Run to test</div>
					)}
				</div>

				{/* Floating Actions Tooltip */}
				<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white shadow-lg p-0 flex gap-1 z-10">
					<button
						onClick={handleRun}
						disabled={isLoading}
						className={`p-2 text-neutral-700 hover:bg-neutral-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
							isFullScreen ? 'text-sm' : 'text-xs'
						}`}
						title={isLoading ? 'Running...' : 'Run'}
					>
						<PlayIcon className="w-4 h-4" />
					</button>
					{hasRun && (
						<>
							<button
								onClick={handleClear}
								className={`p-2 text-neutral-700 hover:bg-neutral-100 transition-all ${
									isFullScreen ? 'text-sm' : 'text-xs'
								}`}
								title="Clear"
							>
								<XMarkIcon className="w-4 h-4" />
							</button>
							{response && !isLoading && (
								<>
									<button
										onClick={handleCopy}
										className={`p-2 text-neutral-700 hover:bg-neutral-100 transition-all ${
											isFullScreen ? 'text-sm' : 'text-xs'
										}`}
										title={isCopied ? 'Copied!' : 'Copy Response'}
									>
										{isCopied ? (
											<CheckIcon className="w-4 h-4 text-success" />
										) : (
											<DocumentDuplicateIcon className="w-4 h-4" />
										)}
									</button>
									<button
										onClick={() => setShowFullModal(true)}
										className="p-2 text-neutral-700 hover:bg-neutral-100 transition-all"
										title="View Full Response"
									>
										<ArrowsPointingOutIcon className="w-4 h-4" />
									</button>
								</>
							)}
						</>
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
										<h3 className="text-lg font-medium text-primary">
											Response - {modelId}
										</h3>
									)
								})()}
							</div>
						</div>

						{/* Modal Content */}
						<div className="flex-1 overflow-y-auto p-4">
							<div className="whitespace-pre-wrap text-primary text-lg leading-relaxed">
								{response}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
