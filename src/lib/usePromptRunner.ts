import { useCallback } from 'react'
import { useSystemPromptStore } from './stores'
import { useAIService, type ChatMessage } from './aiService'
import { useAuthStore } from './authStore'
import { validateResponseAgainstSchema } from './schemaValidation'

export interface RunResult {
	modelId?: string
	rowId?: string
	response: string
	error: Error | null
	duration: number
}

export interface RunOptions {
	activePromptId: string
	activeVersionId: string
	inputPromptContent: string
}

export function usePromptRunner() {
	const {
		getTableData,
		updateTableCellResponse,
		substituteVariables,
		getOutputSchema,
		updateSchemaValidationResult,
	} = useSystemPromptStore()

	const { generateText, hasValidKeyForModel } = useAIService()
	const { user, hasCredits } = useAuthStore()

	// Helper function to check if user can use a model
	const canUseModel = useCallback(
		(modelId: string): boolean => {
			return Boolean((user && hasCredits()) || hasValidKeyForModel(modelId))
		},
		[user, hasCredits, hasValidKeyForModel]
	)

	// Core function to run a single model with single input
	const runSingleExecution = useCallback(
		async (
			modelId: string,
			input: string,
			rowId: string,
			options: RunOptions
		): Promise<RunResult> => {
			const { activePromptId, activeVersionId, inputPromptContent } = options

			try {
				console.log(`Starting request for ${modelId} with input: ${input}`)

				// Check if we can use this model
				if (!canUseModel(modelId)) {
					const errorMessage =
						user && !hasCredits()
							? `Error: Insufficient credits for ${modelId}`
							: `Error: API key required for ${modelId}`

					updateTableCellResponse(
						activePromptId,
						activeVersionId,
						rowId,
						modelId,
						errorMessage
					)

					return {
						modelId,
						rowId,
						response: errorMessage,
						error: new Error('Missing API key or credits'),
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

				// Execute the AI service call with timing
				const startTime = performance.now()
				const result = await generateText(messages, modelId)
				const endTime = performance.now()
				const duration = endTime - startTime
				const fullResponse = result.text

				// Build usage string if available
				let usageStr = ''
				if (result.usage) {
					usageStr = `__USAGE__${result.usage.promptTokens},${result.usage.completionTokens},${result.usage.totalTokens}`
				}

				// Update store with response and timing data
				updateTableCellResponse(
					activePromptId,
					activeVersionId,
					rowId,
					modelId,
					`${fullResponse}__TIMING__${duration}${usageStr}`
				)

				// Validate response against schema if one exists
				const schema = getOutputSchema(activePromptId, activeVersionId)
				if (schema) {
					const validation = validateResponseAgainstSchema(fullResponse, {
						schema,
					})
					updateSchemaValidationResult(
						activePromptId,
						activeVersionId,
						rowId,
						modelId,
						validation
					)
				}

				return {
					modelId,
					rowId,
					response: fullResponse,
					error: null,
					duration,
				}
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

				return {
					modelId,
					rowId,
					response: fullErrorMessage,
					error: error instanceof Error ? error : new Error(errorMessage),
					duration: 0,
				}
			}
		},
		[
			canUseModel,
			user,
			hasCredits,
			updateTableCellResponse,
			substituteVariables,
			generateText,
			getOutputSchema,
			updateSchemaValidationResult,
		]
	)

	// Set loading state for cells
	const setLoadingState = useCallback(
		(
			activePromptId: string,
			activeVersionId: string,
			cells: { rowId: string; modelId: string }[]
		) => {
			cells.forEach(({ rowId, modelId }) => {
				updateTableCellResponse(
					activePromptId,
					activeVersionId,
					rowId,
					modelId,
					'<loading>'
				)
			})
		},
		[updateTableCellResponse]
	)

	// 1. Run single cell (one model, one input)
	const runSingleCell = useCallback(
		async (
			modelId: string,
			input: string,
			rowId: string,
			options: RunOptions
		): Promise<RunResult> => {
			const { activePromptId, activeVersionId } = options

			// Validate input
			if (!input.trim()) {
				throw new Error('Input is required')
			}

			// Set loading state
			setLoadingState(activePromptId, activeVersionId, [{ rowId, modelId }])

			// Execute single run
			return runSingleExecution(modelId, input, rowId, options)
		},
		[runSingleExecution, setLoadingState]
	)

	// 2. Run all models for single row (all selected models, one input)
	const runAllModelsForRow = useCallback(
		async (
			modelIds: string[],
			input: string,
			rowId: string,
			options: RunOptions
		): Promise<RunResult[]> => {
			const { activePromptId, activeVersionId } = options

			// Validate input
			if (!input.trim()) {
				throw new Error('Input is required')
			}

			// Set loading state for all models
			const cells = modelIds.map((modelId) => ({ rowId, modelId }))
			setLoadingState(activePromptId, activeVersionId, cells)

			// Run all models in parallel
			const promises = modelIds.map((modelId) =>
				runSingleExecution(modelId, input, rowId, options)
			)

			const results = await Promise.all(promises)
			console.log('All models completed for row:', results)
			return results
		},
		[runSingleExecution, setLoadingState]
	)

	// 3. Run single model for all rows (one model, all inputs)
	const runModelForAllRows = useCallback(
		async (modelId: string, options: RunOptions): Promise<RunResult[]> => {
			const { activePromptId, activeVersionId } = options

			// Get all rows with content
			const tableData = getTableData(activePromptId, activeVersionId)
			const rowsWithContent = tableData.filter((row) => row.input.trim())

			if (rowsWithContent.length === 0) {
				throw new Error('No rows with content found')
			}

			// Set loading state for all rows with this model
			const cells = rowsWithContent.map((row) => ({ rowId: row.id, modelId }))
			setLoadingState(activePromptId, activeVersionId, cells)

			// Run model for all rows in parallel
			const promises = rowsWithContent.map((row) =>
				runSingleExecution(modelId, row.input, row.id, options)
			)

			const results = await Promise.all(promises)
			console.log(`All rows completed for model ${modelId}:`, results)
			return results
		},
		[runSingleExecution, setLoadingState, getTableData]
	)

	// 4. Run entire table (all models, all inputs)
	const runEntireTable = useCallback(
		async (modelIds: string[], options: RunOptions): Promise<RunResult[]> => {
			const { activePromptId, activeVersionId } = options

			// Get all rows with content
			const tableData = getTableData(activePromptId, activeVersionId)
			const rowsWithContent = tableData.filter((row) => row.input.trim())

			if (rowsWithContent.length === 0) {
				throw new Error('No rows with content found')
			}

			// Set loading state for all cells
			const cells = rowsWithContent.flatMap((row) =>
				modelIds.map((modelId) => ({ rowId: row.id, modelId }))
			)
			setLoadingState(activePromptId, activeVersionId, cells)

			// Run all combinations in parallel
			const promises = rowsWithContent.flatMap((row) =>
				modelIds.map((modelId) =>
					runSingleExecution(modelId, row.input, row.id, options)
				)
			)

			const results = await Promise.all(promises)
			console.log('All table requests completed:', results)
			return results
		},
		[runSingleExecution, setLoadingState, getTableData]
	)

	return {
		runSingleCell,
		runAllModelsForRow,
		runModelForAllRows,
		runEntireTable,
		canUseModel,
	}
}
