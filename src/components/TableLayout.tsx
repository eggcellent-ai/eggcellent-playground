import { useSystemPromptStore, AVAILABLE_MODELS } from '../lib/stores'
import { detectVariables } from '../lib/stores'
import { useAuthStore } from '../lib/authStore'
import {
	ArrowsPointingOutIcon,
	ArrowsPointingInIcon,
} from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import { CheckIcon } from '@heroicons/react/24/solid'
import { useState, useEffect, useCallback } from 'react'
import PromptVersionHistory from './PromptVersionHistory'
import ModelSelectionSection from './ModelSelectionSection'
import { useAIService, type ChatMessage } from '../lib/aiService'
import ResponseTable from './ResponseTable'
import InputSection from './InputSection'
import SchemaInput from './SchemaInput'
import { getTableValidation, getVariableFormats } from '../lib/tableUtils'
import { validateResponseAgainstSchema } from '../lib/schemaValidation'

interface TableLayoutProps {
	inputPromptContent: string
}

export default function TableLayout({ inputPromptContent }: TableLayoutProps) {
	const {
		activePromptId,
		activeVersionId,
		getTableData,
		removeTableRow,
		updateTableRowInput,
		updateTableCellResponse,
		updatePrompt,
		updatePromptTitle,
		prompts,
		getPromptVariables,
		updatePromptVariable,
		substituteVariables,
		getSelectedModels,
		updateSelectedModels,
		getOutputSchema,
		updateSchemaValidationResult,
	} = useSystemPromptStore()

	const { generateText, hasValidKeyForModel } = useAIService()
	const { user } = useAuthStore()

	// Helper function to check if user can use a model (logged in OR has API key)
	const canUseModel = (modelId: string): boolean => {
		return Boolean(user || hasValidKeyForModel(modelId))
	}

	// Get selected models from store
	const selectedModels = getSelectedModels(
		activePromptId || '',
		activeVersionId || ''
	)
	const [runningAllTable, setRunningAllTable] = useState(false)
	const [showVersionHistory, setShowVersionHistory] = useState(false)
	const [promptContent, setPromptContent] = useState(inputPromptContent)
	const [editorHeight, setEditorHeight] = useState(200) // Default height in pixels
	const [isEditorExpanded, setIsEditorExpanded] = useState(false)
	const [updateSuccess, setUpdateSuccess] = useState(false)
	const [titleContent, setTitleContent] = useState('')
	const [detectedVariables, setDetectedVariables] = useState<string[]>([])
	const [showFullPreview, setShowFullPreview] = useState(false)
	const [showFullScreenResponses, setShowFullScreenResponses] = useState(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

	// Get current prompt
	const currentPrompt = prompts.find((p) => p.id === activePromptId)
	const currentVersion = currentPrompt?.versions.find(
		(v) => v.versionId === activeVersionId
	)

	// Update promptContent when version changes
	useEffect(() => {
		if (currentVersion) {
			setPromptContent(currentVersion.content)
			setTitleContent(currentVersion.title || '')
			setHasUnsavedChanges(false)
		}
	}, [currentVersion])

	// Table validation function
	const validation = getTableValidation(
		getTableData(activePromptId || '', activeVersionId || ''),
		selectedModels,
		canUseModel,
		AVAILABLE_MODELS
	)

	// Get table data for current version
	const tableData = getTableData(activePromptId || '', activeVersionId || '')

	// Detect variables in prompt content
	useEffect(() => {
		const variables = detectVariables(promptContent)
		setDetectedVariables(variables)

		// Automatically add detected variables to the store if they don't exist
		if (activePromptId && variables.length > 0) {
			const currentVariables = getPromptVariables(activePromptId || '')

			variables.forEach((variable) => {
				// Only add if variable doesn't already exist
				if (!(variable in currentVariables)) {
					updatePromptVariable(activePromptId || '', variable, '')
				}
			})
		}
	}, [promptContent, activePromptId, getPromptVariables, updatePromptVariable])

	const handleRemoveRow = (rowId: string) => {
		if (activePromptId && tableData.length > 1) {
			removeTableRow(activePromptId || '', rowId)
		}
	}

	const handleUpdateRowInput = (rowId: string, input: string) => {
		if (activePromptId) {
			updateTableRowInput(activePromptId || '', rowId, input)
		}
	}

	const handleRemoveModel = (modelId: string) => {
		if (selectedModels.includes(modelId)) {
			const newModels = selectedModels.filter((id) => id !== modelId)
			if (activePromptId && activeVersionId) {
				updateSelectedModels(activePromptId || '', activeVersionId, newModels)
			}
		}
	}

	const handleAddModel = (modelIds: string | string[]) => {
		// If it's an array from the modal, treat it as the complete new selection
		if (Array.isArray(modelIds)) {
			if (activePromptId && activeVersionId) {
				updateSelectedModels(activePromptId || '', activeVersionId, modelIds)
			}
		} else {
			// Single model ID case (from "Add Model" button)
			const newModels = [...new Set([...selectedModels, modelIds])]
			if (activePromptId && activeVersionId) {
				updateSelectedModels(activePromptId || '', activeVersionId, newModels)
			}
		}
	}

	const handleRunAllModels = async (rowId: string, input: string) => {
		// Allow if there's text input
		const hasContent = input.trim()
		if (!hasContent || !activePromptId || !activeVersionId) return

		try {
			// Clear all existing responses and set loading state for each cell
			selectedModels.forEach((modelId) => {
				updateTableCellResponse(
					activePromptId || '',
					activeVersionId,
					rowId,
					modelId,
					'<loading>' // Special marker to indicate loading state
				)
			})

			// Run all selected models in parallel
			const promises = selectedModels.map(async (modelId) => {
				try {
					console.log(`Starting request for ${modelId} with input: ${input}`)

					// Check if we can use this model (logged in OR has API key)
					if (!canUseModel(modelId)) {
						const errorMessage = `Error: API key required for ${modelId}`
						updateTableCellResponse(
							activePromptId || '',
							activeVersionId,
							rowId,
							modelId,
							errorMessage
						)
						return {
							modelId,
							response: errorMessage,
							error: new Error('Missing API key'),
							duration: 0,
						}
					}

					// Build messages array for AI service
					const messages: ChatMessage[] = [
						{
							role: 'system',
							content: substituteVariables(
								activePromptId,
								activeVersionId,
								inputPromptContent
							),
						},
						{
							role: 'user',
							content: input.trim(),
						},
					]

					// Use non-streaming AI service
					const startTime = performance.now()
					const result = await generateText(messages, modelId)
					const endTime = performance.now()
					const duration = endTime - startTime
					const fullResponse = result.text
					let usageStr = ''
					if (result.usage) {
						usageStr = `__USAGE__${result.usage.promptTokens},${result.usage.completionTokens},${result.usage.totalTokens}`
					}
					updateTableCellResponse(
						activePromptId || '',
						activeVersionId,
						rowId,
						modelId,
						`${fullResponse}__TIMING__${duration}${usageStr}`
					)

					// Validate response against schema if one exists
					const schema = getOutputSchema(activePromptId || '', activeVersionId)
					if (schema) {
						const validation = validateResponseAgainstSchema(fullResponse, {
							schema,
						})
						updateSchemaValidationResult(
							activePromptId || '',
							activeVersionId,
							rowId,
							modelId,
							validation
						)
					}

					return { modelId, response: fullResponse, error: null, duration }
				} catch (error) {
					console.error(`Error with ${modelId}:`, error)
					const errorMessage =
						error instanceof Error
							? error.message
							: `Failed to get response from ${modelId}`
					const fullErrorMessage = `Error: ${errorMessage}`
					updateTableCellResponse(
						activePromptId || '',
						activeVersionId,
						rowId,
						modelId,
						fullErrorMessage
					)
					return {
						modelId,
						response: fullErrorMessage,
						error: error,
						duration: 0,
					}
				}
			})

			// Wait for all models to complete
			const results = await Promise.all(promises)
			console.log('All models completed:', results)
		} catch (error) {
			console.error('Error in handleRunAllModels:', error)
		}
	}

	// Function to run a specific model for all rows with content
	const handleRunModelForAllRows = async (modelId: string) => {
		if (!activePromptId || !activeVersionId) return

		// Get all rows with content
		const rowsWithContent = tableData.filter((row) => row.input.trim())

		if (rowsWithContent.length === 0) return

		try {
			// Clear existing responses and set loading state for this model only
			rowsWithContent.forEach((row) => {
				updateTableCellResponse(
					activePromptId || '',
					activeVersionId,
					row.id,
					modelId,
					'<loading>' // Special marker to indicate loading state
				)
			})

			// Run the specific model for all rows in parallel
			const promises = rowsWithContent.map(async (row) => {
				try {
					console.log(
						`Starting request for ${modelId} with input: ${row.input}`
					)

					// Check if we can use this model (logged in OR has API key)
					if (!canUseModel(modelId)) {
						const errorMessage = `Error: API key required for ${modelId}`
						updateTableCellResponse(
							activePromptId || '',
							activeVersionId,
							row.id,
							modelId,
							errorMessage
						)
						return {
							rowId: row.id,
							response: errorMessage,
							error: new Error('Missing API key'),
							duration: 0,
						}
					}

					// Build messages array for AI service
					const messages: ChatMessage[] = [
						{
							role: 'system',
							content: substituteVariables(
								activePromptId,
								activeVersionId,
								inputPromptContent
							),
						},
						{
							role: 'user',
							content: row.input.trim(),
						},
					]

					// Use non-streaming AI service
					const startTime = performance.now()
					const result = await generateText(messages, modelId)
					const endTime = performance.now()
					const duration = endTime - startTime
					const fullResponse = result.text
					let usageStr = ''
					if (result.usage) {
						usageStr = `__USAGE__${result.usage.promptTokens},${result.usage.completionTokens},${result.usage.totalTokens}`
					}
					updateTableCellResponse(
						activePromptId || '',
						activeVersionId,
						row.id,
						modelId,
						`${fullResponse}__TIMING__${duration}${usageStr}`
					)

					// Validate response against schema if one exists
					const schema = getOutputSchema(activePromptId || '', activeVersionId)
					if (schema) {
						const validation = validateResponseAgainstSchema(fullResponse, {
							schema,
						})
						updateSchemaValidationResult(
							activePromptId || '',
							activeVersionId,
							row.id,
							modelId,
							validation
						)
					}

					return {
						rowId: row.id,
						response: fullResponse,
						error: null,
						duration,
					}
				} catch (error) {
					console.error(`Error with ${modelId} for row ${row.id}:`, error)
					const errorMessage =
						error instanceof Error
							? error.message
							: `Failed to get response from ${modelId}`
					const fullErrorMessage = `Error: ${errorMessage}`
					updateTableCellResponse(
						activePromptId || '',
						activeVersionId,
						row.id,
						modelId,
						fullErrorMessage
					)
					return {
						rowId: row.id,
						response: fullErrorMessage,
						error: error,
						duration: 0,
					}
				}
			})

			// Wait for all rows to complete
			const results = await Promise.all(promises)
			console.log(`All rows completed for model ${modelId}:`, results)
		} catch (error) {
			console.error('Error in handleRunModelForAllRows:', error)
		}
	}

	const handleRunAllTable = useCallback(async () => {
		if (!activePromptId || !activeVersionId || runningAllTable) return

		// Get all rows with content
		const rowsWithContent = tableData.filter((row) => row.input.trim())

		if (rowsWithContent.length === 0) return

		// Clear all existing responses and set loading state for each cell
		rowsWithContent.forEach((row) => {
			selectedModels.forEach((modelId) => {
				updateTableCellResponse(
					activePromptId || '',
					activeVersionId,
					row.id,
					modelId,
					'<loading>' // Special marker to indicate loading state
				)
			})
		})

		setRunningAllTable(true)

		try {
			// Run all rows in parallel
			const rowPromises = rowsWithContent.map(async (row) => {
				try {
					// Run all selected models for this row in parallel
					const modelPromises = selectedModels.map(async (modelId) => {
						try {
							console.log(
								`Starting table request for ${modelId} with input: ${row.input}`
							)

							// Check if we can use this model (logged in OR has API key)
							if (!canUseModel(modelId)) {
								const errorMessage = `Error: API key required for ${modelId}`
								updateTableCellResponse(
									activePromptId || '',
									activeVersionId,
									row.id,
									modelId,
									errorMessage
								)
								return {
									modelId,
									response: errorMessage,
									error: new Error('Missing API key'),
									duration: 0,
								}
							}

							// Build messages array for AI service
							const messages: ChatMessage[] = [
								{
									role: 'system',
									content: substituteVariables(
										activePromptId,
										activeVersionId,
										inputPromptContent
									),
								},
								{
									role: 'user',
									content: row.input.trim(),
								},
							]

							// Use non-streaming AI service
							const startTime = performance.now()
							const result = await generateText(messages, modelId)
							const endTime = performance.now()
							const duration = endTime - startTime
							const fullResponse = result.text
							let usageStr = ''
							if (result.usage) {
								usageStr = `__USAGE__${result.usage.promptTokens},${result.usage.completionTokens},${result.usage.totalTokens}`
							}
							updateTableCellResponse(
								activePromptId || '',
								activeVersionId,
								row.id,
								modelId,
								`${fullResponse}__TIMING__${duration}${usageStr}`
							)

							// Validate response against schema if one exists
							const schema = getOutputSchema(
								activePromptId || '',
								activeVersionId
							)
							if (schema) {
								const validation = validateResponseAgainstSchema(fullResponse, {
									schema,
								})
								updateSchemaValidationResult(
									activePromptId || '',
									activeVersionId,
									row.id,
									modelId,
									validation
								)
							}

							return { modelId, response: fullResponse, error: null, duration }
						} catch (error) {
							console.error(`Error with ${modelId}:`, error)
							const errorMessage =
								error instanceof Error
									? error.message
									: `Failed to get response from ${modelId}`
							const fullErrorMessage = `Error: ${errorMessage}`
							updateTableCellResponse(
								activePromptId || '',
								activeVersionId,
								row.id,
								modelId,
								fullErrorMessage
							)
							return {
								modelId,
								response: fullErrorMessage,
								error: error,
								duration: 0,
							}
						}
					})

					// Wait for all models to complete for this row
					const results = await Promise.all(modelPromises)
					console.log(`All models completed for row ${row.id}:`, results)
					return { rowId: row.id, results }
				} catch (error) {
					console.error(`Error processing row ${row.id}:`, error)
					return { rowId: row.id, error }
				}
			})

			// Wait for all rows to complete
			const allResults = await Promise.all(rowPromises)
			console.log('All table requests completed:', allResults)
		} catch (error) {
			console.error('Error in handleRunAllTable:', error)
		} finally {
			setRunningAllTable(false)
		}
	}, [
		activePromptId,
		activeVersionId,
		runningAllTable,
		tableData,
		selectedModels,
		hasValidKeyForModel,
		generateText,
		updateTableCellResponse,
		substituteVariables,
		inputPromptContent,
		getOutputSchema,
		updateSchemaValidationResult,
	])

	const handleSavePrompt = () => {
		if (activePromptId && promptContent.trim()) {
			updatePrompt(activePromptId || '', promptContent)
			setUpdateSuccess(true)
			setHasUnsavedChanges(false)
			setTimeout(() => setUpdateSuccess(false), 1000)
		}
	}

	const handleSaveTitle = () => {
		if (activePromptId && activeVersionId) {
			updatePromptTitle(activePromptId || '', activeVersionId, titleContent)
		}
	}

	useEffect(() => {
		setPromptContent(inputPromptContent)
		setHasUnsavedChanges(false)
	}, [inputPromptContent])

	// No longer needed - modal handles its own backdrop clicks

	// Variable helper functions
	const getCurrentVariables = () => {
		if (!activePromptId) return {}
		return getPromptVariables(activePromptId || '')
	}

	const handleUpdateVariable = (key: string, value: string) => {
		if (!activePromptId) return
		updatePromptVariable(activePromptId || '', key, value)
	}

	// Add keyboard shortcut handler
	const handleKeyboardShortcut = useCallback(
		(event: KeyboardEvent) => {
			// Check for Cmd + Enter (Mac) or Ctrl + Enter (Windows)
			if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
				// Check if table can be run
				const canRunTable =
					!runningAllTable &&
					tableData.some((row) => row.input.trim()) &&
					selectedModels.length > 0 &&
					!selectedModels.some((modelId) => !canUseModel(modelId))

				if (canRunTable) {
					handleRunAllTable()
				}
			}
		},
		[runningAllTable, tableData, selectedModels, canUseModel, handleRunAllTable]
	)

	// Add event listener for keyboard shortcut
	useEffect(() => {
		document.addEventListener('keydown', handleKeyboardShortcut)
		return () => {
			document.removeEventListener('keydown', handleKeyboardShortcut)
		}
	}, [handleKeyboardShortcut])

	return (
		<div
			className="flex flex-col w-full gap-4"
			style={{
				paddingBottom: '400px', // Fixed padding for floating control panel
			}}
		>
			{/* Show table only if there's an active prompt version */}
			{activePromptId && activeVersionId ? (
				<>
					{/* Floating Bottom Control Panel - Only Title and Run Button */}
					<div
						className="fixed bottom-0 z-30 bg-white border-t border-neutral shadow-lg"
						style={{ left: '0rem', right: '0rem' }}
					>
						<div className="mx-auto px-4 sm:px-6 lg:px-8">
							<div className="flex justify-between items-center gap-2 p-4 bg-surface-card">
								<div className="flex-1">
									<input
										type="text"
										value={titleContent}
										onChange={(e) => setTitleContent(e.target.value)}
										onBlur={handleSaveTitle}
										id="prompt-title"
										name="prompt-title"
										className="text-lg font-semibold text-primary bg-transparent border-none outline-none focus:outline-none w-full"
										placeholder="Enter prompt title..."
									/>
									{/* Validation Messages */}
									{(() => {
										if (!validation.isValid && validation.messages.length > 0) {
											return (
												<div className="mt-2 text-sm text-error-dark">
													<div className="flex items-start gap-2">
														<div>
															<div className="space-y-1">
																{validation.messages.map((message, index) => (
																	<div key={index} className="text-xs">
																		{message}
																	</div>
																))}
															</div>
														</div>
													</div>
												</div>
											)
										}
										return null
									})()}
								</div>
								<div className="flex gap-2">
									{/* View Full Screen Responses Button */}
									{tableData.some((row) =>
										selectedModels.some((modelId) =>
											row.responses[modelId]?.trim()
										)
									) && (
										<button
											onClick={() => setShowFullScreenResponses(true)}
											className="px-4 py-2 bg-surface-card border border-neutral hover:bg-neutral-hover text-primary font-medium transition-colors flex items-center gap-2 focus:outline-none focus:ring-0"
										>
											<ArrowsPointingOutIcon className="w-4 h-4" />
											Responses
										</button>
									)}
									<button
										onClick={handleRunAllTable}
										disabled={
											runningAllTable ||
											!tableData.some((row) => row.input.trim()) ||
											selectedModels.length === 0 ||
											selectedModels.some((modelId) => !canUseModel(modelId))
										}
										className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 focus:outline-none focus:ring-0 focus:bg-primary-dark"
									>
										<PlayIcon className="w-4 h-4" />
										{runningAllTable ? 'Running ...' : 'Run table'}
									</button>
								</div>
							</div>
						</div>
					</div>
					{/* ===== SYSTEM PROMPT SECTION ===== */}
					<div>
						{/* Section Header */}
						<div className="px-2 pb-2 pt-8">
							<div className="flex justify-between items-center">
								<h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
									System Prompt
								</h2>
								{hasUnsavedChanges && (
									<span className="text-xs text-warning-dark bg-warning-light px-2 py-1 rounded">
										Unsaved changes
									</span>
								)}
							</div>
						</div>
						<div className="border border-neutral">
							{/* Prompt Editor */}
							<div className="bg-surface-card">
								<div className="p-4 relative">
									{/* Expand/Collapse Icon - Top Right */}
									<button
										onClick={() => setIsEditorExpanded(!isEditorExpanded)}
										className="absolute top-2 right-2 p-1 text-secondary hover:text-primary hover:bg-neutral-hover transition-colors z-10"
										title={
											isEditorExpanded ? 'Collapse editor' : 'Expand editor'
										}
									>
										{isEditorExpanded ? (
											<ArrowsPointingInIcon className="w-4 h-4" />
										) : (
											<ArrowsPointingOutIcon className="w-4 h-4" />
										)}
									</button>
									<textarea
										className="w-full resize-y bg-surface-card text-primary placeholder-text-muted transition-colors text-sm focus:outline-none"
										style={{
											height: isEditorExpanded
												? 'calc(100vh - 200px)'
												: `${editorHeight}px`,
											minHeight: isEditorExpanded
												? 'calc(100vh - 200px)'
												: `${editorHeight}px`,
										}}
										value={promptContent}
										id="system-prompt"
										name="system-prompt"
										placeholder="Enter system prompt..."
										onChange={(e) => {
											setPromptContent(e.target.value)
											setHasUnsavedChanges(true)
										}}
										onInput={(e) => {
											if (!isEditorExpanded) {
												const target = e.target as HTMLTextAreaElement
												setEditorHeight(target.offsetHeight)
											}
										}}
									/>

									<div className="flex justify-end items-center gap-2 mt-3">
										<button
											onClick={() => setShowVersionHistory(!showVersionHistory)}
											className={`px-4 py-2 text-sm border transition-colors ${
												showVersionHistory
													? 'bg-neutral border-neutral text-primary'
													: 'border-neutral text-secondary hover:border-neutral-dark hover:bg-neutral-hover'
											}`}
										>
											{showVersionHistory
												? 'Hide Version'
												: `Show Version (${
														currentPrompt?.versions.length || 0
												  })`}
										</button>
										<button
											onClick={handleSavePrompt}
											className={`px-4 py-2 text-sm border ${
												updateSuccess
													? 'bg-success border-success text-white'
													: hasUnsavedChanges
													? 'bg-warning border-warning text-white hover:bg-warning-dark'
													: 'bg-neutral-dark border-neutral-dark text-white hover:bg-primary'
											} transition-colors flex items-center gap-1`}
										>
											{updateSuccess ? (
												<>
													<CheckIcon className="w-3 h-3" />
													Updated
												</>
											) : hasUnsavedChanges ? (
												'Save Changes'
											) : (
												'Update Prompt'
											)}
										</button>
									</div>
								</div>
							</div>
						</div>
						{/* Version History */}
						{showVersionHistory && (
							<div className="border-t border-neutral p-4">
								<h3 className="text-sm font-semibold mb-3 text-primary">
									Version History
								</h3>
								<PromptVersionHistory activePromptId={activePromptId || ''} />
							</div>
						)}
					</div>
					{/* ===== VARIABLES SECTION ===== */}
					{detectedVariables.length > 0 && (
						<div>
							{/* Section Header */}
							<div className="px-2 pb-2 pt-8">
								<h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
									Variables
								</h2>
							</div>

							{/* Variables Display */}
							<div>
								<div className="overflow-x-auto bg-surface-card">
									<table className="w-full text-sm border-collapse">
										<tbody>
											{detectedVariables.map((variable) => {
												const currentVariables = getCurrentVariables()
												const value = currentVariables[variable] || ''
												const hasValue = value.trim() !== ''
												const formats = getVariableFormats(
													variable,
													promptContent
												)

												return (
													<tr key={variable}>
														<td className="border border-neutral px-3 py-2 font-mono text-sm">
															<div className="flex flex-wrap gap-1">
																{formats.map((format, index) => (
																	<code
																		key={index}
																		className={`px-1 py-0.5 rounded text-xs ${
																			hasValue
																				? 'bg-success-light text-success-dark'
																				: 'bg-warning-light text-warning-dark'
																		}`}
																	>
																		{format}
																	</code>
																))}
																{formats.length === 0 && (
																	<code className="px-1 py-0.5 rounded text-xs bg-warning-light text-warning-dark">
																		{`{{${variable}}}`}
																	</code>
																)}
															</div>
														</td>
														<td className="border border-neutral px-3 py-2">
															<input
																type="text"
																value={value}
																onChange={(e) =>
																	handleUpdateVariable(variable, e.target.value)
																}
																id={`var-${variable}`}
																name={`var-${variable}`}
																placeholder="Enter value..."
																className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-secondary text-primary"
															/>
														</td>
														<td className="border border-neutral px-3 py-2">
															<span
																className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
																	hasValue
																		? 'bg-success-light text-success-dark'
																		: 'bg-warning-light text-warning-dark'
																}`}
															>
																{hasValue ? '✓ Set' : '⚠ Empty'}
															</span>
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
								{/* Final Prompt Preview */}
								<div className="p-4">
									<div className="flex gap-4 items-center mb-4">
										<div className="text-xs font-medium text-gray-500">
											{detectedVariables.length} variables will be substituted
										</div>
										<button
											onClick={() => setShowFullPreview(!showFullPreview)}
											className="text-xs text-blue-500 font-medium"
										>
											{showFullPreview ? 'Hide Prompt' : 'Show final prompt'}
										</button>
									</div>
									<div
										className={`text-sm text-primary whitespace-pre-wrap break-words bg-amber-50 p-4 border border-amber-200 ${
											!showFullPreview ? 'hidden' : ''
										}`}
										id="prompt-preview"
										role="textbox"
										aria-label="Final prompt preview"
									>
										{activePromptId && activeVersionId
											? substituteVariables(
													activePromptId || '',
													activeVersionId,
													promptContent
											  )
											: promptContent}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* ===== INPUT SECTION ===== */}
					<InputSection
						activePromptId={activePromptId}
						activeVersionId={activeVersionId}
					/>

					{/* ===== MODELS SECTION ===== */}
					<ModelSelectionSection
						selectedModels={selectedModels}
						onAddModel={handleAddModel}
						onRemoveModel={handleRemoveModel}
					/>

					{/* ===== RESPONSE SECTION ===== */}
					<div className="flex-1 flex flex-col overflow-hidden">
						{/* Section Header */}
						<div className="px-2 pb-2 pt-8">
							<h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
								Responses
							</h2>
						</div>

						{/* Results Table */}
						<ResponseTable
							tableData={tableData}
							selectedModels={selectedModels}
							activePromptId={activePromptId || ''}
							activeVersionId={activeVersionId}
							inputPromptContent={inputPromptContent}
							hasValidKeyForModel={canUseModel}
							onRunAllModels={handleRunAllModels}
							onRunModelForAllRows={handleRunModelForAllRows}
							onRemoveRow={handleRemoveRow}
							onUpdateRowInput={handleUpdateRowInput}
							onRemoveModel={handleRemoveModel}
							isFullScreen={showFullScreenResponses}
							onClose={() => setShowFullScreenResponses(false)}
						/>
					</div>

					{/* ===== SCHEMA VALIDATION SECTION ===== */}
					<SchemaInput
						activePromptId={activePromptId}
						activeVersionId={activeVersionId}
					/>
				</>
			) : (
				// Show message when no prompt is selected
				<div className="flex-1 flex items-center justify-center bg-surface-hover">
					<div className="text-center text-muted">
						<h2 className="text-lg font-semibold mb-2 text-primary">
							No Prompt Selected
						</h2>
						<p>Create or select a prompt to start using the table view</p>
					</div>
				</div>
			)}
		</div>
	)
}
