import { useSystemPromptStore, AVAILABLE_MODELS } from '../lib/stores'
import { detectVariables } from '../lib/stores'
import { useAuthStore } from '../lib/authStore'
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import { useState, useEffect, useCallback } from 'react'
import ModelSelectionSection from './ModelSelectionSection'
import PromptEditor from './PromptEditor'
import { useAIService, type ChatMessage } from '../lib/aiService'
import ResponseTable from './ResponseTable'
import InputSection from './InputSection'
import SchemaInput from './SchemaInput'
import VariablesSection from './VariablesSection'
import { getTableValidation } from '../lib/tableUtils'
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
	const { user, hasCredits } = useAuthStore()

	// Helper function to check if user can use a model (logged in with credits OR has API key)
	const canUseModel = useCallback(
		(modelId: string): boolean => {
			return Boolean((user && hasCredits()) || hasValidKeyForModel(modelId))
		},
		[user, hasCredits, hasValidKeyForModel]
	)

	// Get selected models from store
	const selectedModels = getSelectedModels(
		activePromptId || '',
		activeVersionId || ''
	)
	const [runningAllTable, setRunningAllTable] = useState(false)
	const [promptContent, setPromptContent] = useState(inputPromptContent)
	const [titleContent, setTitleContent] = useState('')
	const [detectedVariables, setDetectedVariables] = useState<string[]>([])
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

					// Check if we can use this model (logged in with credits OR has API key)
					if (!canUseModel(modelId)) {
						const errorMessage =
							user && !hasCredits()
								? `Error: Insufficient credits for ${modelId}`
								: `Error: API key required for ${modelId}`
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

					// Check if we can use this model (logged in with credits OR has API key)
					if (!canUseModel(modelId)) {
						const errorMessage =
							user && !hasCredits()
								? `Error: Insufficient credits for ${modelId}`
								: `Error: API key required for ${modelId}`
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

							// Check if we can use this model (logged in with credits OR has API key)
							if (!canUseModel(modelId)) {
								const errorMessage =
									user && !hasCredits()
										? `Error: Insufficient credits for ${modelId}`
										: `Error: API key required for ${modelId}`
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
		generateText,
		updateTableCellResponse,
		substituteVariables,
		inputPromptContent,
		getOutputSchema,
		updateSchemaValidationResult,
		canUseModel,
		hasCredits,
		user,
	])

	const handleSaveTitle = () => {
		if (activePromptId && activeVersionId) {
			updatePromptTitle(activePromptId || '', activeVersionId, titleContent)
		}
	}

	useEffect(() => {
		setPromptContent(inputPromptContent)
		setHasUnsavedChanges(false)
	}, [inputPromptContent])

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
					<PromptEditor
						activePromptId={activePromptId || ''}
						promptContent={promptContent}
						onPromptContentChange={setPromptContent}
						hasUnsavedChanges={hasUnsavedChanges}
						onUnsavedChangesChange={setHasUnsavedChanges}
					/>

					{/* ===== VARIABLES SECTION ===== */}
					<VariablesSection
						activePromptId={activePromptId}
						activeVersionId={activeVersionId}
						detectedVariables={detectedVariables}
						promptContent={promptContent}
					/>

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
