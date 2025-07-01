import { useSystemPromptStore, AVAILABLE_MODELS } from '../lib/stores'
import { detectVariables } from '../lib/stores'
import {
	PlusIcon,
	XMarkIcon,
	ArrowsPointingOutIcon,
	ArrowsPointingInIcon,
} from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import { CheckIcon } from '@heroicons/react/24/solid'
import { useState, useEffect, useRef, useCallback } from 'react'
import InputComponent, { type UploadedImage } from './InputComponent'
import TableCell from './TableCell'
import PromptVersionHistory from './PromptVersionHistory'
import { useAIService, type ChatMessage } from '../lib/aiService'

interface TableLayoutProps {
	inputPromptContent: string
}

export default function TableLayout({ inputPromptContent }: TableLayoutProps) {
	const {
		activePromptId,
		activeVersionId,
		getTableData,
		addTableRow,
		removeTableRow,
		updateTableRowInput,
		updateTableCellResponse,
		updatePrompt,
		updatePromptTitle,
		prompts,
		getPromptVariables,
		updatePromptVariable,
		substituteVariables,
	} = useSystemPromptStore()

	const { streamText, hasValidKeyForModel } = useAIService()

	const [selectedModels, setSelectedModels] = useState<string[]>([
		AVAILABLE_MODELS[0].id,
		AVAILABLE_MODELS[1].id,
	])
	const [runningRows, setRunningRows] = useState<Set<string>>(new Set())
	const [runningAllTable, setRunningAllTable] = useState(false)
	const [showVersionHistory, setShowVersionHistory] = useState(false)
	const [promptContent, setPromptContent] = useState(inputPromptContent)
	const [editorHeight, setEditorHeight] = useState(200) // Default height in pixels
	const [isEditorExpanded, setIsEditorExpanded] = useState(false)
	const [updateSuccess, setUpdateSuccess] = useState(false)
	const [titleContent, setTitleContent] = useState('')
	const [showModelDropdown, setShowModelDropdown] = useState(false)
	const [jsonInputValue, setJsonInputValue] = useState('')
	const [jsonValidationStatus, setJsonValidationStatus] = useState<{
		isValid: boolean
		message: string
		isEmpty: boolean
	}>({ isValid: true, message: '', isEmpty: true })
	const [detectedVariables, setDetectedVariables] = useState<string[]>([])
	const [showFullPreview, setShowFullPreview] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Table validation function
	const getTableValidation = () => {
		const validationMessages: string[] = []

		// Check if there are any input rows
		if (!tableData || tableData.length === 0) {
			validationMessages.push('No input rows available')
		} else {
			// Check if any rows have content
			const rowsWithContent = tableData.filter(
				(row) => row.input.trim() || (row.images || []).length > 0
			)

			if (rowsWithContent.length === 0) {
				validationMessages.push('All input rows are empty')
			}
		}

		// Check if any models are selected
		if (selectedModels.length === 0) {
			validationMessages.push('No models selected')
		}

		// Check if selected models have valid API keys
		const modelsWithoutKeys = selectedModels.filter(
			(modelId) => !hasValidKeyForModel(modelId)
		)
		if (modelsWithoutKeys.length > 0) {
			const modelNames = modelsWithoutKeys
				.map((modelId) => {
					const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
					return model?.name || modelId
				})
				.join(', ')
			validationMessages.push(`Missing API keys for: ${modelNames}`)
		}

		return {
			isValid: validationMessages.length === 0,
			messages: validationMessages,
		}
	}

	// Get table data for current version
	const tableData = getTableData(activePromptId, activeVersionId)

	// Get current prompt title
	const currentPrompt = prompts.find((p) => p.id === activePromptId)
	const currentVersion = currentPrompt?.versions.find(
		(v) => v.versionId === activeVersionId
	)
	const currentTitle = currentVersion?.title || ''

	// Function to load current input rows as JSON
	const loadCurrentDataToJson = useCallback(() => {
		if (!activePromptId) return ''

		// Get current input rows and convert to JSON
		const currentPrompt = prompts.find((p) => p.id === activePromptId)
		const inputRows = currentPrompt?.inputRows || []

		// Convert to simple array of strings/objects
		const jsonData = inputRows
			.filter((row) => row.input.trim() || (row.images || []).length > 0) // Only include rows with content
			.map((row) => {
				// If row has images, create an object with both input and images info
				if ((row.images || []).length > 0) {
					return {
						input: row.input,
						images: row.images.length + ' image(s)', // Simplified representation
					}
				}
				// If only text input, return just the string
				return row.input
			})

		// If no existing data, return example input
		if (jsonData.length === 0) {
			return JSON.stringify(['example input'], null, 2)
		}

		return JSON.stringify(jsonData, null, 2)
	}, [activePromptId, prompts])

	// Function to validate JSON format
	const validateJsonInput = useCallback(
		(value: string) => {
			const trimmedValue = value.trim()

			if (!trimmedValue) {
				setJsonValidationStatus({
					isValid: true,
					message: '',
					isEmpty: true,
				})
				return
			}

			try {
				const parsed = JSON.parse(trimmedValue)

				// Check if it's a valid format we can process
				if (Array.isArray(parsed)) {
					if (parsed.length === 0) {
						setJsonValidationStatus({
							isValid: true,
							message: '',
							isEmpty: true,
						})
					} else {
						setJsonValidationStatus({
							isValid: true,
							message: `Valid - ${parsed.length} rows detected`,
							isEmpty: false,
						})
					}
				} else if (typeof parsed === 'object' && parsed !== null) {
					// Check for array properties
					const arrayProps = ['items', 'data', 'inputs', 'messages', 'content']
					const foundArrayProp = arrayProps.find((prop) =>
						Array.isArray(parsed[prop])
					)

					if (foundArrayProp) {
						const arrayLength = parsed[foundArrayProp].length
						if (arrayLength === 0) {
							setJsonValidationStatus({
								isValid: true,
								message: '',
								isEmpty: true,
							})
						} else {
							setJsonValidationStatus({
								isValid: true,
								message: `Valid - ${arrayLength} rows detected`,
								isEmpty: false,
							})
						}
					} else {
						// Count non-null values
						const values = Object.values(parsed).filter(
							(val) =>
								typeof val === 'string' ||
								typeof val === 'number' ||
								(typeof val === 'object' && val !== null)
						)
						if (values.length > 0) {
							setJsonValidationStatus({
								isValid: true,
								message: `Valid JSON - Will create ${values.length} row(s) from object values`,
								isEmpty: false,
							})
						} else {
							setJsonValidationStatus({
								isValid: true,
								message: 'Valid JSON - No processable values found',
								isEmpty: false,
							})
						}
					}
				} else {
					setJsonValidationStatus({
						isValid: false,
						message: 'Invalid - must be array or object',
						isEmpty: false,
					})
				}
			} catch {
				setJsonValidationStatus({
					isValid: false,
					message: 'Invalid - JSON format error',
					isEmpty: false,
				})
			}
		},
		[setJsonValidationStatus]
	)

	// Sync title content when version changes
	useEffect(() => {
		setTitleContent(currentTitle)
	}, [currentTitle])

	// Auto-load current data to JSON input when version changes
	useEffect(() => {
		if (activePromptId && activeVersionId) {
			const currentDataJson = loadCurrentDataToJson()
			setJsonInputValue(currentDataJson)
			validateJsonInput(currentDataJson)
		}
	}, [
		activePromptId,
		activeVersionId,
		loadCurrentDataToJson,
		validateJsonInput,
	])

	// Initialize table with example input if empty
	useEffect(() => {
		if (activePromptId && activeVersionId && tableData.length === 0) {
			// Add a row with example input directly
			addTableRow(activePromptId, 'example input')
		}
	}, [activePromptId, activeVersionId, tableData.length, addTableRow])

	// Detect variables in prompt content
	useEffect(() => {
		const variables = detectVariables(promptContent)
		setDetectedVariables(variables)

		// Automatically add detected variables to the store if they don't exist
		if (activePromptId && variables.length > 0) {
			const currentVariables = getPromptVariables(activePromptId)

			variables.forEach((variable) => {
				// Only add if variable doesn't already exist
				if (!(variable in currentVariables)) {
					updatePromptVariable(activePromptId, variable, '')
				}
			})
		}
	}, [promptContent, activePromptId, getPromptVariables, updatePromptVariable])

	const handleAddRow = () => {
		if (activePromptId) {
			addTableRow(activePromptId)
		}
	}

	const handleRemoveRow = (rowId: string) => {
		if (activePromptId && tableData.length > 1) {
			removeTableRow(activePromptId, rowId)
		}
	}

	const handleUpdateRowInput = (
		rowId: string,
		input: string,
		images: UploadedImage[] = []
	) => {
		if (activePromptId) {
			updateTableRowInput(activePromptId, rowId, input, images)
		}
	}

	// Function to handle JSON input changes with validation
	const handleJsonInputChange = (value: string) => {
		setJsonInputValue(value)
		validateJsonInput(value)
	}

	// Function to save JSON data by replacing all current rows
	const handleSaveJsonData = () => {
		if (!activePromptId || !jsonInputValue.trim()) return

		try {
			const jsonData = JSON.parse(jsonInputValue.trim())

			// First, clear all existing rows
			const currentPrompt = prompts.find((p) => p.id === activePromptId)
			if (currentPrompt) {
				const currentRows = currentPrompt.inputRows || []
				currentRows.forEach((row) => {
					removeTableRow(activePromptId, row.id)
				})
			}

			// Handle array of items
			if (Array.isArray(jsonData)) {
				if (jsonData.length === 0) {
					// If empty array, just clear all rows (already done above)
					return
				}

				// Create rows for all items
				jsonData.forEach((item) => {
					// Determine the input value based on item type
					let inputValue: string
					if (typeof item === 'string') {
						inputValue = item
					} else if (typeof item === 'object' && item !== null) {
						// For objects, try to use common properties or stringify
						if (item.input) {
							inputValue = item.input
						} else if (item.text) {
							inputValue = item.text
						} else if (item.message) {
							inputValue = item.message
						} else if (item.content) {
							inputValue = item.content
						} else {
							inputValue = JSON.stringify(item)
						}
					} else {
						inputValue = String(item)
					}

					// Add new row with the input value directly
					addTableRow(activePromptId!, inputValue)
				})

				// JSON input remains visible after saving
				return
			}

			// Handle single object
			if (typeof jsonData === 'object' && jsonData !== null) {
				// If it's an object with an array property, use that array
				const arrayProps = ['items', 'data', 'inputs', 'messages', 'content']
				for (const prop of arrayProps) {
					if (Array.isArray(jsonData[prop])) {
						const arrayData = jsonData[prop]
						arrayData.forEach((item: unknown) => {
							const inputValue =
								typeof item === 'string' ? item : JSON.stringify(item)
							addTableRow(activePromptId!, inputValue)
						})

						return
					}
				}

				// If object has multiple properties, create rows from property values
				const values = Object.values(jsonData).filter(
					(val) =>
						typeof val === 'string' ||
						typeof val === 'number' ||
						(typeof val === 'object' && val !== null)
				)

				if (values.length > 0) {
					values.forEach((value) => {
						const inputValue =
							typeof value === 'string' ? value : JSON.stringify(value)
						addTableRow(activePromptId!, inputValue)
					})

					return
				}
			}
		} catch {
			alert('Invalid JSON format. Please check your input and try again.')
		}
	}

	const handleRemoveModel = (modelId: string) => {
		setSelectedModels((prev) => {
			// Don't allow removing the last model
			if (prev.length <= 1) return prev
			return prev.filter((id) => id !== modelId)
		})
	}

	const handleAddModel = (modelId: string) => {
		setSelectedModels((prev) => {
			if (!prev.includes(modelId)) {
				return [...prev, modelId]
			}
			return prev
		})
		setShowModelDropdown(false)
	}

	const handleRunAllModels = async (
		rowId: string,
		input: string,
		images: UploadedImage[] = []
	) => {
		// Allow if there's either text input or images
		const hasContent = input.trim() || images.length > 0
		if (!hasContent || !activePromptId || !activeVersionId) return

		// Set loading state for this row
		setRunningRows((prev) => new Set(prev).add(rowId))

		try {
			// Run all selected models in parallel
			const promises = selectedModels.map(async (modelId) => {
				try {
					console.log(
						`Starting request for ${modelId} with input: ${input}, images: ${images.length}`
					)

					// Check if we have a valid API key for this model
					if (!hasValidKeyForModel(modelId)) {
						const errorMessage = `Error: API key required for ${modelId}`
						updateTableCellResponse(
							activePromptId,
							activeVersionId,
							rowId,
							modelId,
							errorMessage
						)
						return {
							modelId,
							response: errorMessage,
							error: new Error('Missing API key'),
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

					// Use AI service for generation
					const fullResponse = await streamText(messages, modelId)

					console.log(
						`Completed request for ${modelId}, response length: ${fullResponse.length}`
					)

					// Save response to store
					updateTableCellResponse(
						activePromptId,
						activeVersionId,
						rowId,
						modelId,
						fullResponse
					)

					return { modelId, response: fullResponse, error: null }
				} catch (error) {
					console.error(`Error with ${modelId}:`, error)
					const errorMessage =
						error instanceof Error
							? error.message
							: `Failed to get response from ${modelId}`
					const fullErrorMessage = `Error: ${errorMessage}`
					updateTableCellResponse(
						activePromptId,
						activeVersionId,
						rowId,
						modelId,
						fullErrorMessage
					)
					return { modelId, response: fullErrorMessage, error: error }
				}
			})

			// Wait for all models to complete
			const results = await Promise.all(promises)
			console.log('All models completed:', results)
		} catch (error) {
			console.error('Error in handleRunAllModels:', error)
		} finally {
			// Clear loading state for this row
			setRunningRows((prev) => {
				const newSet = new Set(prev)
				newSet.delete(rowId)
				return newSet
			})
		}
	}

	const handleRunAllTable = async () => {
		if (!activePromptId || !activeVersionId || runningAllTable) return

		// Get all rows with content
		const rowsWithContent = tableData.filter(
			(row) => row.input.trim() || (row.images || []).length > 0
		)

		if (rowsWithContent.length === 0) return

		// Clear all existing responses before starting new runs
		rowsWithContent.forEach((row) => {
			selectedModels.forEach((modelId) => {
				updateTableCellResponse(
					activePromptId,
					activeVersionId,
					row.id,
					modelId,
					''
				)
			})
		})

		setRunningAllTable(true)

		try {
			// Run all rows in parallel
			const rowPromises = rowsWithContent.map(async (row) => {
				// Set loading state for this row
				setRunningRows((prev) => new Set(prev).add(row.id))

				try {
					// Run all selected models for this row in parallel
					const modelPromises = selectedModels.map(async (modelId) => {
						try {
							console.log(
								`Starting table request for ${modelId} with input: ${
									row.input
								}, images: ${(row.images || []).length}`
							)

							// Check if we have a valid API key for this model
							if (!hasValidKeyForModel(modelId)) {
								const errorMessage = `Error: API key required for ${modelId}`
								updateTableCellResponse(
									activePromptId,
									activeVersionId,
									row.id,
									modelId,
									errorMessage
								)
								return {
									modelId,
									response: errorMessage,
									error: new Error('Missing API key'),
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
							]

							// Build user message content
							if ((row.images || []).length > 0) {
								// Multimodal content
								const content: Array<
									| { type: 'text'; text: string }
									| { type: 'image'; image: string }
								> = []

								if (row.input.trim()) {
									content.push({
										type: 'text',
										text: row.input.trim(),
									})
								}

								;(row.images || []).forEach((image) => {
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
									content: row.input.trim(),
								})
							}

							// Use AI service for generation
							const fullResponse = await streamText(messages, modelId)

							console.log(
								`Completed table request for ${modelId}, response length: ${fullResponse.length}`
							)

							// Save response to store
							updateTableCellResponse(
								activePromptId,
								activeVersionId,
								row.id,
								modelId,
								fullResponse
							)

							return { modelId, response: fullResponse, error: null }
						} catch (error) {
							console.error(`Error with ${modelId}:`, error)
							const errorMessage =
								error instanceof Error
									? error.message
									: `Failed to get response from ${modelId}`
							const fullErrorMessage = `Error: ${errorMessage}`
							updateTableCellResponse(
								activePromptId,
								activeVersionId,
								row.id,
								modelId,
								fullErrorMessage
							)
							return { modelId, response: fullErrorMessage, error: error }
						}
					})

					// Wait for all models to complete for this row
					const results = await Promise.all(modelPromises)
					console.log(`All models completed for row ${row.id}:`, results)
					return { rowId: row.id, results }
				} catch (error) {
					console.error(`Error processing row ${row.id}:`, error)
					return { rowId: row.id, error }
				} finally {
					// Clear loading state for this row
					setRunningRows((prev) => {
						const newSet = new Set(prev)
						newSet.delete(row.id)
						return newSet
					})
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
	}

	const handleSavePrompt = () => {
		if (activePromptId && promptContent.trim()) {
			updatePrompt(activePromptId, promptContent)
			setUpdateSuccess(true)
			setTimeout(() => setUpdateSuccess(false), 1000)
		}
	}

	const handleSaveTitle = () => {
		if (activePromptId && activeVersionId) {
			updatePromptTitle(activePromptId, activeVersionId, titleContent)
		}
	}

	useEffect(() => {
		setPromptContent(inputPromptContent)
	}, [inputPromptContent])

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setShowModelDropdown(false)
			}
		}

		if (showModelDropdown) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [showModelDropdown])

	// Variable helper functions
	const getCurrentVariables = () => {
		if (!activePromptId) return {}
		return getPromptVariables(activePromptId)
	}

	const handleUpdateVariable = (key: string, value: string) => {
		if (!activePromptId) return
		updatePromptVariable(activePromptId, key, value)
	}

	// Function to detect which format(s) a variable is using in the prompt content
	const getVariableFormats = (variableName: string): string[] => {
		const formats: string[] = []

		// Check for {{variable}} format
		const curlyBracePattern = new RegExp(
			`\\{\\{\\s*${variableName.replace(
				/[.*+?^${}()|[\]\\]/g,
				'\\$&'
			)}\\s*\\}\\}`,
			'g'
		)
		if (curlyBracePattern.test(promptContent)) {
			formats.push(`{{${variableName}}}`)
		}

		// Check for ${variable} format
		const dollarBracePattern = new RegExp(
			`\\$\\{\\s*${variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}`,
			'g'
		)
		if (dollarBracePattern.test(promptContent)) {
			formats.push(`\${${variableName}}`)
		}

		return formats
	}

	return (
		<div
			className="flex flex-col w-full h-full overflow-hidden"
			style={{
				paddingBottom: '80px', // Fixed padding for floating control panel
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
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="flex justify-between items-center gap-2 p-4 bg-surface-card">
								<div className="flex-1">
									<input
										type="text"
										value={titleContent}
										onChange={(e) => setTitleContent(e.target.value)}
										onBlur={handleSaveTitle}
										className="text-lg font-semibold text-text-primary bg-transparent border-none outline-none focus:outline-none w-full"
										placeholder="Enter prompt title..."
									/>
									{/* Validation Messages */}
									{(() => {
										const validation = getTableValidation()
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
								<button
									onClick={handleRunAllTable}
									disabled={
										runningAllTable ||
										!tableData.some(
											(row) => row.input.trim() || (row.images || []).length > 0
										) ||
										selectedModels.length === 0 ||
										selectedModels.some(
											(modelId) => !hasValidKeyForModel(modelId)
										)
									}
									className="px-5 py-2 bg-primary hover:bg-secondary text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
								>
									<PlayIcon className="w-4 h-4" />
									{runningAllTable ? 'Running All...' : 'Run Table'}
								</button>
							</div>
						</div>
					</div>

					{/* ===== SYSTEM PROMPT SECTION ===== */}
					<div>
						{/* Section Header */}
						<div className="bg-neutral-50 px-2 pb-2 pt-8">
							<h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
								System Prompt
							</h2>
						</div>
						<div className="border border-neutral">
							{/* Prompt Editor */}
							<div className="bg-surface-card">
								<div className="p-4 relative">
									{/* Expand/Collapse Icon - Top Right */}
									<button
										onClick={() => setIsEditorExpanded(!isEditorExpanded)}
										className="absolute top-2 right-2 p-1 text-text-secondary hover:text-text-primary hover:bg-neutral-hover transition-colors z-10"
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
										className="w-full resize-y bg-surface-card text-text-primary placeholder-text-muted transition-colors text-sm focus:outline-none"
										style={{
											height: isEditorExpanded
												? 'calc(100vh - 200px)'
												: `${editorHeight}px`,
											minHeight: isEditorExpanded
												? 'calc(100vh - 200px)'
												: `${editorHeight}px`,
										}}
										value={promptContent}
										placeholder="Enter system prompt..."
										onChange={(e) => setPromptContent(e.target.value)}
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
													? 'bg-neutral border-neutral text-text-primary'
													: 'border-neutral text-text-secondary hover:border-neutral-dark hover:bg-neutral-hover'
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
													: 'bg-neutral-dark border-neutral-dark text-white hover:bg-primary'
											} transition-colors flex items-center gap-1`}
										>
											{updateSuccess ? (
												<>
													<CheckIcon className="w-3 h-3" />
													Updated
												</>
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
								<h3 className="text-sm font-semibold mb-3 text-text-primary">
									Version History
								</h3>
								<PromptVersionHistory activePromptId={activePromptId} />
							</div>
						)}
					</div>

					{/* ===== VARIABLES SECTION ===== */}
					{detectedVariables.length > 0 && (
						<div>
							{/* Section Header */}
							<div className="bg-neutral-50 px-2 pb-2 pt-8">
								<h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
									Variables
								</h2>
							</div>

							{/* Variables Display */}
							<div className="p-4 border border-neutral bg-surface-card">
								<div className="overflow-x-auto">
									<table className="w-full text-sm border-collapse">
										<tbody>
											{detectedVariables.map((variable) => {
												const currentVariables = getCurrentVariables()
												const value = currentVariables[variable] || ''
												const hasValue = value.trim() !== ''
												const formats = getVariableFormats(variable)

												return (
													<tr key={variable} className="hover:bg-neutral-50">
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
																placeholder="Enter value..."
																className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
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
								<div className="pt-4">
									<div className="flex justify-between items-center mb-2">
										<div className="text-xs font-medium text-gray-500">
											{detectedVariables.length} variables will be substituted
										</div>
										<button
											onClick={() => setShowFullPreview(!showFullPreview)}
											className="text-xs text-text-secondary"
										>
											{showFullPreview ? 'Show Less' : 'Show All'}
										</button>
									</div>
									<div
										className={`text-sm text-text-primary whitespace-pre-wrap break-words p-2 bg-amber-50 ${
											!showFullPreview ? 'line-clamp-2 overflow-hidden' : ''
										}`}
										style={
											!showFullPreview
												? {
														display: '-webkit-box',
														WebkitLineClamp: 2,
														WebkitBoxOrient: 'vertical' as const,
														overflow: 'hidden',
												  }
												: {}
										}
									>
										{activePromptId && activeVersionId
											? substituteVariables(
													activePromptId,
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
					<div>
						{/* Section Header */}
						<div className="bg-neutral-50 px-2 pb-2 pt-8">
							<h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
								Input
							</h2>
						</div>

						{/* Bulk JSON Input */}
						<div className="p-4 border border-neutral bg-surface-card">
							<div className="mb-3 flex justify-start items-center gap-2">
								<h3 className="text-sm font-semibold text-text-primary">
									Bulk Input
								</h3>
								{!jsonValidationStatus.isEmpty && (
									<div
										className={`text-xs px-2 py-1 ${
											jsonValidationStatus.isValid
												? 'text-success-dark'
												: 'text-error-dark border-error'
										}`}
									>
										{jsonValidationStatus.isValid ? '✅' : '❌'}{' '}
										{jsonValidationStatus.message}
									</div>
								)}
							</div>

							<div className="space-y-3">
								<div className="space-y-2">
									<textarea
										value={jsonInputValue}
										onChange={(e) => handleJsonInputChange(e.target.value)}
										placeholder={`Current input rows are automatically loaded. Edit the JSON to manage multiple rows.

Examples of valid formats:
["Input 1", "Input 2", "Input 3"]
[{"input": "Test 1"}, {"text": "Test 2"}]
{"items": ["Item 1", "Item 2"]}`}
										className={`w-full h-32 p-3 border text-sm resize-none bg-surface-input transition-colors focus:ring-none ${
											jsonValidationStatus.isEmpty
												? 'border-neutral'
												: jsonValidationStatus.isValid
												? 'border-neutral focus:ring-success'
												: 'border-error focus:ring-error'
										}`}
									/>
								</div>
								<div className="flex items-center justify-between">
									{/* Add Single Input */}
									<div>
										<button
											onClick={handleAddRow}
											className="flex items-center px-4 py-2 text-sm text-neutral-dark hover:text-text-primary hover:bg-neutral-hover transition-colors border border-neutral"
										>
											<PlusIcon className="w-4 h-4 mr-2" />
											Add Single Input
										</button>
									</div>
									<div className="flex gap-2">
										<button
											onClick={handleSaveJsonData}
											disabled={
												!jsonInputValue.trim() || !jsonValidationStatus.isValid
											}
											className="px-4 py-2 bg-secondary text-white text-sm hover:bg-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										>
											Update Inputs
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* ===== RESPONSE SECTION ===== */}
					<div className="flex-1 flex flex-col overflow-hidden">
						{/* Section Header */}
						<div className="bg-neutral-50 px-2 pb-2 pt-8">
							<h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
								Response
							</h2>
						</div>

						{/* Results Table */}
						<div className="flex-1 overflow-auto bg-surface-card">
							<table className="w-full h-full table-fixed border-collapse border border-neutral">
								<thead className="sticky top-0">
									<tr>
										<th className="p-3 text-left text-sm font-semibold w-1/3 text-text-primary border-b border-r border-neutral">
											Input
										</th>
										{selectedModels.map((modelId, index) => {
											const model = AVAILABLE_MODELS.find(
												(m) => m.id === modelId
											)
											const columnWidth = `${Math.floor(
												60 / selectedModels.length
											)}%`
											return (
												<th
													key={modelId}
													className={`p-3 text-left text-sm font-semibold text-text-primary border-b border-neutral ${
														index < selectedModels.length - 1
															? 'border-r border-neutral'
															: ''
													}`}
													style={{ width: columnWidth }}
												>
													<div className="flex items-center justify-between">
														<div>
															{model?.name}
															<span className="block text-xs font-normal text-text-secondary">
																{model?.provider}
															</span>
														</div>
														<button
															onClick={() => handleRemoveModel(modelId)}
															className="p-1 rounded-full text-muted hover:text-error hover:bg-error-light transition-colors ml-2"
															title="Remove model"
														>
															<XMarkIcon className="w-4 h-4" />
														</button>
													</div>
												</th>
											)
										})}
										<th className="p-3 text-center text-sm font-semibold w-16 bg-surface-card text-text-primary border-b border-l border-neutral relative">
											<div ref={dropdownRef}>
												<button
													onClick={() =>
														setShowModelDropdown(!showModelDropdown)
													}
													className="w-8 h-8 rounded-full border-2 border-dashed border-neutral hover:border-neutral-dark hover:bg-neutral-hover transition-colors flex items-center justify-center"
													title="Add model"
												>
													<PlusIcon className="w-4 h-4 text-muted" />
												</button>

												{/* Model Dropdown */}
												{showModelDropdown && (
													<div className="absolute top-12 right-0 z-40 bg-surface-card shadow-lg border border-neutral min-w-48">
														<div className="p-2">
															<div className="text-xs font-medium text-muted mb-2 px-2">
																Add Model
															</div>
															<div className="max-h-60 overflow-y-auto">
																{AVAILABLE_MODELS.filter(
																	(model) => !selectedModels.includes(model.id)
																).map((model) => (
																	<button
																		key={model.id}
																		onClick={() => handleAddModel(model.id)}
																		className="w-full text-left p-2 hover:bg-neutral-hover transition-colors"
																	>
																		<div className="font-medium text-text-primary text-sm">
																			{model.name}
																		</div>
																		<div className="text-xs text-text-secondary">
																			{model.provider}
																		</div>
																	</button>
																))}
																{AVAILABLE_MODELS.filter(
																	(model) => !selectedModels.includes(model.id)
																).length === 0 && (
																	<div className="text-center py-3 text-muted text-xs">
																		All models selected
																	</div>
																)}
															</div>
														</div>
													</div>
												)}
											</div>
										</th>
									</tr>
								</thead>
								<tbody>
									{tableData.map(
										(
											row: {
												id: string
												input: string
												images: UploadedImage[]
												timestamp: number
												responses: Record<string, string>
											},
											rowIndex: number
										) => (
											<tr key={row.id}>
												<td
													className={`p-3 align-top border-r border-neutral ${
														rowIndex < tableData.length - 1 ? 'border-b' : ''
													}`}
												>
													<div className="space-y-3">
														<InputComponent
															value={row.input}
															images={row.images || []}
															onChange={(value, images) =>
																handleUpdateRowInput(row.id, value, images)
															}
															placeholder="Enter your test input..."
															rows={3}
															showImageUpload={true}
														/>

														{/* Action Buttons */}
														<div className="flex gap-2">
															{/* Run All Models Button */}
															<button
																onClick={() =>
																	handleRunAllModels(
																		row.id,
																		row.input,
																		row.images || []
																	)
																}
																disabled={
																	!(
																		row.input.trim() ||
																		(row.images || []).length > 0
																	) || runningRows.has(row.id)
																}
																className="px-3 py-1 bg-neutral-900 text-white text-xs hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
															>
																<PlayIcon className="w-3 h-3" />
																{runningRows.has(row.id) ? 'Running...' : 'Run'}
															</button>

															{/* Remove Row Button */}
															{tableData.length > 1 && (
																<button
																	onClick={() => handleRemoveRow(row.id)}
																	className="px-3 py-1 border border-neutral text-text-secondary text-xs hover:border-neutral-dark hover:bg-neutral-hover transition-colors"
																	title="Remove row"
																>
																	Remove
																</button>
															)}
														</div>
													</div>
												</td>
												{selectedModels.map((modelId, colIndex) => (
													<td
														key={`${row.id}-${modelId}`}
														className={`p-3 align-top border-neutral ${
															rowIndex < tableData.length - 1 ? 'border-b' : ''
														} ${
															colIndex < selectedModels.length - 1
																? 'border-r border-neutral'
																: ''
														}`}
													>
														<TableCell
															key={`${row.id}-${modelId}-${
																row.responses[modelId] || 'empty'
															}`}
															rowId={row.id}
															modelId={modelId}
															input={row.input}
															images={row.images || []}
															systemPrompt={inputPromptContent}
															activePromptId={activePromptId}
															activeVersionId={activeVersionId}
															isRowRunning={runningRows.has(row.id)}
														/>
													</td>
												))}
												{/* Add Model Column - Empty Cell */}
												<td
													className={`p-3 align-top border-l border-neutral ${
														rowIndex < tableData.length - 1 ? 'border-b' : ''
													}`}
												>
													{/* Empty cell for add model column */}
												</td>
											</tr>
										)
									)}
								</tbody>
							</table>
						</div>
					</div>
				</>
			) : (
				// Show message when no prompt is selected
				<div className="flex-1 flex items-center justify-center bg-surface-hover">
					<div className="text-center text-muted">
						<h2 className="text-lg font-semibold mb-2 text-text-primary">
							No Prompt Selected
						</h2>
						<p>Create or select a prompt to start using the table view</p>
					</div>
				</div>
			)}
		</div>
	)
}
