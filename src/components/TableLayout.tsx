import { useSystemPromptStore, AVAILABLE_MODELS } from '../lib/stores'
import { detectVariables } from '../lib/stores'
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import { useState, useEffect, useCallback } from 'react'
import ModelSelectionSection from './ModelSelectionSection'
import PromptEditor from './PromptEditor'
import ResponseTable from './ResponseTable'
import InputSection from './InputSection'
import SchemaInput from './SchemaInput'
import VariablesSection from './VariablesSection'
import { getTableValidation } from '../lib/tableUtils'
import { usePromptRunner } from '../lib/usePromptRunner'

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
		updatePromptTitle,
		prompts,
		getPromptVariables,
		updatePromptVariable,
		getSelectedModels,
		updateSelectedModels,
	} = useSystemPromptStore()

	const { runModelForAllRows, runEntireTable, canUseModel } = usePromptRunner()

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

	// Function to run a specific model for all rows with content
	const handleRunModelForAllRows = async (modelId: string) => {
		if (!activePromptId || !activeVersionId) return

		try {
			await runModelForAllRows(modelId, {
				activePromptId,
				activeVersionId,
				inputPromptContent,
			})
		} catch (error) {
			console.error('Error in handleRunModelForAllRows:', error)
		}
	}

	const handleRunAllTable = useCallback(async () => {
		if (!activePromptId || !activeVersionId || runningAllTable) return

		setRunningAllTable(true)

		try {
			await runEntireTable(selectedModels, {
				activePromptId,
				activeVersionId,
				inputPromptContent,
			})
		} catch (error) {
			console.error('Error in handleRunAllTable:', error)
		} finally {
			setRunningAllTable(false)
		}
	}, [
		activePromptId,
		activeVersionId,
		runningAllTable,
		selectedModels,
		runEntireTable,
		inputPromptContent,
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
