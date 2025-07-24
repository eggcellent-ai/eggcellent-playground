import { useState, useEffect } from 'react'
import { useSystemPromptStore } from '../lib/stores'
import { useAuthStore } from '../lib/authStore'
import { ApiService } from '../lib/apiService'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { getVariableFormats } from '../lib/tableUtils'

interface VariablesSectionProps {
	activePromptId: string
	activeVersionId: string
	detectedVariables: string[]
	promptContent: string
}

export default function VariablesSection({
	activePromptId,
	activeVersionId,
	detectedVariables,
	promptContent,
}: VariablesSectionProps) {
	const { getPromptVariables, updatePromptVariable, substituteVariables } =
		useSystemPromptStore()
	const { user, hasCredits } = useAuthStore()

	const [isGeneratingVariables, setIsGeneratingVariables] = useState(false)
	const [generateVariablesError, setGenerateVariablesError] = useState<
		string | null
	>(null)
	const [showFullPreview, setShowFullPreview] = useState(false)

	// Function to generate variable values using AI
	const handleGenerateVariables = async () => {
		if (!promptContent.trim()) {
			setGenerateVariablesError('No prompt content available to analyze')
			return
		}

		if (!user || !hasCredits()) {
			setGenerateVariablesError(
				'Please login and ensure you have credits to generate variables'
			)
			return
		}

		if (detectedVariables.length === 0) {
			setGenerateVariablesError('No variables detected in the prompt')
			return
		}

		setIsGeneratingVariables(true)
		setGenerateVariablesError(null)

		try {
			const result = await ApiService.generateInputExamples(promptContent)

			if (
				result.examples &&
				Array.isArray(result.examples) &&
				result.examples.length > 0
			) {
				// Take the first example and use its values to populate variables
				const firstExample = result.examples[0]

				if (typeof firstExample === 'object' && firstExample !== null) {
					// Update each detected variable with values from the generated example
					Object.keys(firstExample).forEach((key) => {
						if (detectedVariables.includes(key) && activePromptId) {
							const value = firstExample[key]
							const stringValue =
								typeof value === 'string' ? value : String(value)
							updatePromptVariable(activePromptId, key, stringValue)
						}
					})
				} else {
					setGenerateVariablesError(
						'Generated examples are not in the expected format'
					)
				}
			} else {
				setGenerateVariablesError(
					'No examples were generated. The prompt may not contain detectable variables.'
				)
			}
		} catch (error) {
			console.error('Error generating variable values:', error)
			setGenerateVariablesError(
				error instanceof Error
					? error.message
					: 'Failed to generate variable values'
			)
		} finally {
			setIsGeneratingVariables(false)
		}
	}

	// Clear generate error when prompt changes
	useEffect(() => {
		setGenerateVariablesError(null)
	}, [activePromptId, activeVersionId, promptContent])

	// Variable helper functions
	const getCurrentVariables = () => {
		if (!activePromptId) return {}
		return getPromptVariables(activePromptId)
	}

	const handleUpdateVariable = (key: string, value: string) => {
		if (!activePromptId) return
		updatePromptVariable(activePromptId, key, value)
	}

	// Don't render if no variables detected
	if (detectedVariables.length === 0) {
		return null
	}

	return (
		<div>
			{/* Section Header */}
			<div className="px-2 pb-2 pt-8 flex justify-between items-center">
				<h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
					Variables
				</h2>
				{/* Generate Variables Button */}
				<button
					onClick={handleGenerateVariables}
					disabled={isGeneratingVariables || !user || !hasCredits()}
					className="px-3 py-1 text-xs bg-primary text-white hover:bg-primary-dark disabled:bg-neutral disabled:text-text-muted transition-colors flex items-center gap-1.5 rounded"
					title={
						!user || !hasCredits()
							? 'Login and ensure you have credits to generate variable values'
							: 'Generate example values for variables using AI (Gemini 2.5 Pro)'
					}
				>
					<SparklesIcon className="w-3 h-3" />
					{isGeneratingVariables ? 'Generating...' : 'Generate'}
				</button>
			</div>

			{/* Generate Error Display */}
			{generateVariablesError && (
				<div className="mx-2 mb-2 p-2 bg-error-light border border-error text-error-dark text-xs rounded">
					{generateVariablesError}
				</div>
			)}

			{/* Variables Display */}
			<div>
				<div className="overflow-x-auto bg-surface-card">
					<table className="w-full text-sm border-collapse">
						<tbody>
							{detectedVariables.map((variable) => {
								const currentVariables = getCurrentVariables()
								const value = currentVariables[variable] || ''
								const hasValue = value.trim() !== ''
								const formats = getVariableFormats(variable, promptContent)

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
									activePromptId,
									activeVersionId,
									promptContent
							  )
							: promptContent}
					</div>
				</div>
			</div>
		</div>
	)
}
