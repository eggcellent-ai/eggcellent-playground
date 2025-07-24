import { useState, useEffect } from 'react'
import { useSystemPromptStore } from '../lib/stores'
import { validateJsonInput } from '../lib/tableUtils'
import { ApiService } from '../lib/apiService'
import { useAuthStore } from '../lib/authStore'
import TableInputForm from './TableInputForm'
import TabGroup from './TabGroup'
import { SparklesIcon } from '@heroicons/react/24/outline'

// Debounce helper function
function debounce(func: (value: string) => void, wait: number) {
	let timeout: NodeJS.Timeout | null = null

	return (value: string) => {
		if (timeout) clearTimeout(timeout)
		timeout = setTimeout(() => func(value), wait)
	}
}

interface InputSectionProps {
	activePromptId: string
	activeVersionId: string
}

type InputMode = 'table' | 'json'

export default function InputSection({
	activePromptId,
	activeVersionId,
}: InputSectionProps) {
	const { addTableRow, removeTableRow, prompts } = useSystemPromptStore()
	const { user, hasCredits } = useAuthStore()
	const [jsonInputValue, setJsonInputValue] = useState('')
	const [jsonValidationStatus, setJsonValidationStatus] = useState<{
		isValid: boolean
		message: string
		isEmpty: boolean
	}>({ isValid: true, message: '', isEmpty: true })
	const [inputMode, setInputMode] = useState<InputMode>('table')
	const [isGeneratingExamples, setIsGeneratingExamples] = useState(false)
	const [generateError, setGenerateError] = useState<string | null>(null)

	// Get current prompt content
	const getCurrentPromptContent = () => {
		const currentPrompt = prompts.find((p) => p.id === activePromptId)
		const currentVersion = currentPrompt?.versions.find(
			(v) => v.versionId === activeVersionId
		)
		return currentVersion?.content || ''
	}

	// Function to handle JSON input changes with validation
	const handleJsonInputChange = (inputValue: string) => {
		setJsonInputValue(inputValue)
		const validation = validateJsonInput(inputValue)
		setJsonValidationStatus(validation)
	}

	// Debounced function to handle JSON saving
	const debouncedHandleJsonSave = debounce((inputValue: string) => {
		const validation = validateJsonInput(inputValue)
		if (validation.isValid && !validation.isEmpty && activePromptId) {
			try {
				const jsonData = JSON.parse(inputValue.trim())

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
						addTableRow(activePromptId, inputValue)
					})

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
								addTableRow(activePromptId, inputValue)
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
							addTableRow(activePromptId, inputValue)
						})

						return
					}
				}
			} catch {
				// Invalid JSON format, do nothing as validation will show the error
			}
		}
	}, 1000) // 1 second debounce

	// Update the textarea onChange handler
	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value
		handleJsonInputChange(newValue)
		debouncedHandleJsonSave(newValue)
	}

	// Function to generate input examples
	const handleGenerateExamples = async () => {
		const promptContent = getCurrentPromptContent()
		if (!promptContent.trim()) {
			setGenerateError('No prompt content available to analyze')
			return
		}

		if (!user || !hasCredits()) {
			setGenerateError(
				'Please login and ensure you have credits to generate examples'
			)
			return
		}

		setIsGeneratingExamples(true)
		setGenerateError(null)

		try {
			const result = await ApiService.generateInputExamples(promptContent)

			if (
				result.examples &&
				Array.isArray(result.examples) &&
				result.examples.length > 0
			) {
				// Convert the generated examples to JSON format and set it
				const jsonData = JSON.stringify(result.examples, null, 2)
				setJsonInputValue(jsonData)
				handleJsonInputChange(jsonData)
				debouncedHandleJsonSave(jsonData)

				// Switch to JSON mode to show the generated examples
				setInputMode('json')
			} else {
				setGenerateError(
					'No examples were generated. The prompt may not contain detectable variables.'
				)
			}
		} catch (error) {
			console.error('Error generating examples:', error)
			setGenerateError(
				error instanceof Error ? error.message : 'Failed to generate examples'
			)
		} finally {
			setIsGeneratingExamples(false)
		}
	}

	// Auto-load current data to JSON input when version changes
	useEffect(() => {
		if (activePromptId && activeVersionId) {
			const currentPrompt = prompts.find((p) => p.id === activePromptId)
			if (currentPrompt) {
				const rows = currentPrompt.inputRows || []
				const jsonData = JSON.stringify(
					rows.map((row) => row.input),
					null,
					2
				)
				setJsonInputValue(jsonData)
				handleJsonInputChange(jsonData)
			}
		}
	}, [activePromptId, activeVersionId, prompts])

	// Clear generate error when switching modes or prompt changes
	useEffect(() => {
		setGenerateError(null)
	}, [inputMode, activePromptId, activeVersionId])

	return (
		<div>
			{/* Section Header */}
			<div className="pb-2 pt-8 px-2 flex justify-between items-center">
				<h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
					Input
				</h2>
				{/* Generate Examples Button */}
				<button
					onClick={handleGenerateExamples}
					disabled={isGeneratingExamples || !user || !hasCredits()}
					className="px-3 py-1 text-xs text-primary hover:bg-amber-200 disabled:bg-neutral disabled:text-text-muted transition-colors flex items-center gap-1.5 rounded"
					title={
						!user || !hasCredits()
							? 'Login and ensure you have credits to generate examples'
							: 'Generate example inputs using AI (Gemini 2.5 Pro)'
					}
				>
					<SparklesIcon className="w-3 h-3" />
					{isGeneratingExamples ? 'Generating...' : 'Generate Examples'}
				</button>
			</div>

			{/* Generate Error Display */}
			{generateError && (
				<div className="mx-2 mb-2 p-2 bg-error-light border border-error text-error-dark text-xs rounded">
					{generateError}
				</div>
			)}

			{/* Input Content */}
			<div className="border border-neutral bg-surface-card">
				{/* Tab Buttons */}
				<TabGroup<InputMode>
					items={[
						{ id: 'table', label: 'Table Input' },
						{ id: 'json', label: 'JSON Input' },
					]}
					className="border-b border-neutral"
					activeId={inputMode}
					onChange={setInputMode}
				/>
				<div className="p-4 bg-surface-card">
					{inputMode === 'table' ? (
						<TableInputForm activePromptId={activePromptId} />
					) : (
						<textarea
							value={jsonInputValue}
							onChange={handleTextareaChange}
							id="json-input"
							name="json-input"
							placeholder={`Current input rows are automatically loaded. Edit the JSON to manage multiple rows.

Examples of valid formats:
["Input 1", "Input 2", "Input 3"]
[{"input": "Test 1"}, {"text": "Test 2"}]
{"items": ["Item 1", "Item 2"]}

Use the "Generate Examples" button to auto-generate inputs from your prompt variables.`}
							className="w-full resize-y bg-surface-card text-primary placeholder-text-muted transition-colors text-sm focus:outline-none h-54"
						/>
					)}
				</div>
			</div>
			{!jsonValidationStatus.isEmpty && inputMode === 'json' && (
				<div
					className={`text-xs py-3 px-1 ${
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
	)
}
