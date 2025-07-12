import { useState, useEffect } from 'react'
import { useSystemPromptStore } from '../lib/stores'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface SchemaInputProps {
	activePromptId: string | null
	activeVersionId: string | null
}

export default function SchemaInput({
	activePromptId,
	activeVersionId,
}: SchemaInputProps) {
	const [isExpanded, setIsExpanded] = useState(false)
	const [schemaValue, setSchemaValue] = useState('')
	const [isValidSchema, setIsValidSchema] = useState(true)
	const [validationMessage, setValidationMessage] = useState('')

	const { getOutputSchema, updateOutputSchema } = useSystemPromptStore()

	// Load existing schema when version changes
	useEffect(() => {
		if (activePromptId && activeVersionId) {
			const existingSchema = getOutputSchema(activePromptId, activeVersionId)
			setSchemaValue(existingSchema || '')
			validateSchema(existingSchema || '')
		}
	}, [activePromptId, activeVersionId, getOutputSchema])

	// Validate JSON schema
	const validateSchema = (schema: string) => {
		if (!schema.trim()) {
			setIsValidSchema(true)
			setValidationMessage('')
			return
		}

		try {
			const parsed = JSON.parse(schema)
			if (parsed && typeof parsed === 'object') {
				setIsValidSchema(true)
				setValidationMessage('✅ Valid JSON schema')
			} else {
				setIsValidSchema(false)
				setValidationMessage('❌ Schema must be a JSON object')
			}
		} catch {
			setIsValidSchema(false)
			setValidationMessage('❌ Invalid JSON format')
		}
	}

	// Handle schema input changes
	const handleSchemaChange = (value: string) => {
		setSchemaValue(value)
		validateSchema(value)

		// Save to store with debouncing
		if (activePromptId && activeVersionId) {
			updateOutputSchema(activePromptId, activeVersionId, value)
		}
	}

	// Clear schema
	const clearSchema = () => {
		setSchemaValue('')
		setIsValidSchema(true)
		setValidationMessage('')

		if (activePromptId && activeVersionId) {
			updateOutputSchema(activePromptId, activeVersionId, '')
		}
	}

	return (
		<div className="border border-neutral bg-surface-card mt-4">
			{/* Header */}
			<div
				className="flex justify-between items-center p-4 cursor-pointer hover:bg-neutral-hover transition-colors"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<div className="flex items-center gap-2">
					<h3 className="text-sm font-semibold text-primary">
						Output Schema Validation
					</h3>
					{schemaValue.trim() && (
						<span className="text-xs px-2 py-1 bg-primary text-white">
							Active
						</span>
					)}
				</div>
				{isExpanded ? (
					<ChevronUpIcon className="w-4 h-4 text-secondary" />
				) : (
					<ChevronDownIcon className="w-4 h-4 text-secondary" />
				)}
			</div>

			{/* Expanded Content */}
			{isExpanded && (
				<div className="border-t border-neutral p-4 space-y-4">
					{/* Description */}
					<div className="text-sm text-secondary">
						Define a JSON schema to validate AI model outputs. The schema will
						be used to check if responses match the expected format.
					</div>

					{/* Schema Input */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<label className="text-sm font-medium text-primary">
								JSON Schema:
							</label>
							{schemaValue.trim() && (
								<button
									onClick={clearSchema}
									className="text-xs text-error hover:text-error-dark transition-colors"
								>
									Clear Schema
								</button>
							)}
						</div>
						<textarea
							value={schemaValue}
							onChange={(e) => handleSchemaChange(e.target.value)}
							placeholder={`Enter JSON schema for output validation...

Example:
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["name"]
}`}
							className={`w-full h-48 resize-none p-3 text-sm font-mono border transition-colors focus:outline-none ${
								schemaValue.trim()
									? isValidSchema
										? 'border-success bg-green-50'
										: 'border-error bg-red-50'
									: 'border-neutral bg-surface-card'
							}`}
						/>
					</div>

					{/* Validation Status */}
					{validationMessage && (
						<div
							className={`text-xs p-2  ${
								isValidSchema
									? 'bg-success/10 text-success-dark'
									: 'bg-error/10 text-error-dark'
							}`}
						>
							{validationMessage}
						</div>
					)}

					{/* Info */}
					{schemaValue.trim() && isValidSchema && (
						<div className="text-xs text-secondary bg-neutral-50 p-3 ">
							<strong>How it works:</strong> When you run AI models, their
							responses will be automatically validated against this schema.
							Valid responses will show a green checkmark, while invalid ones
							will display validation errors.
						</div>
					)}
				</div>
			)}
		</div>
	)
}
