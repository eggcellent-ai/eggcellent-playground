import { useState, useEffect } from 'react'
import { useSystemPromptStore } from '../lib/stores'
import { validateJsonInput } from '../lib/tableUtils'
import TableInputForm from './TableInputForm'

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

type InputMode = 'json' | 'table'

export default function InputSection({
	activePromptId,
	activeVersionId,
}: InputSectionProps) {
	const { addTableRow, removeTableRow, prompts } = useSystemPromptStore()
	const [jsonInputValue, setJsonInputValue] = useState('')
	const [jsonValidationStatus, setJsonValidationStatus] = useState<{
		isValid: boolean
		message: string
		isEmpty: boolean
	}>({ isValid: true, message: '', isEmpty: true })
	const [inputMode, setInputMode] = useState<InputMode>('json')

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

	return (
		<div>
			{/* Section Header */}
			<div className="bg-neutral-50 pb-2 pt-8 px-2 flex justify-between items-center">
				<h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
					Input
				</h2>

				{/* Tab Buttons */}
				<div className="flex gap-2 mt-4">
					<button
						onClick={() => setInputMode('json')}
						className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
							inputMode === 'json'
								? 'bg-white text-primary border-b-2 border-primary'
								: 'text-text-muted hover:text-text-primary'
						}`}
					>
						JSON Input
					</button>
					<button
						onClick={() => setInputMode('table')}
						className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
							inputMode === 'table'
								? 'bg-white text-primary border-b-2 border-primary'
								: 'text-text-muted hover:text-text-primary'
						}`}
					>
						Table Input
					</button>
				</div>
			</div>

			{/* Input Content */}
			<div className="border border-neutral">
				<div className="p-4 bg-surface-card">
					{inputMode === 'json' ? (
						<textarea
							value={jsonInputValue}
							onChange={handleTextareaChange}
							placeholder={`Current input rows are automatically loaded. Edit the JSON to manage multiple rows.

Examples of valid formats:
["Input 1", "Input 2", "Input 3"]
[{"input": "Test 1"}, {"text": "Test 2"}]
{"items": ["Item 1", "Item 2"]}`}
							className="w-full resize-y bg-surface-card text-text-primary placeholder-text-muted transition-colors text-sm focus:outline-none h-54"
						/>
					) : (
						<TableInputForm activePromptId={activePromptId} />
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
