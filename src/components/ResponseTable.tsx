import { PlayIcon } from '@heroicons/react/24/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'
import InputComponent from './InputComponent'
import TableCell from './TableCell'
import ModelItem from './ModelItem'
import { AVAILABLE_MODELS } from '../lib/stores'
import { useEffect } from 'react'

interface ResponseTableProps {
	tableData: Array<{
		id: string
		input: string
		timestamp: number
		responses: Record<string, string>
	}>
	selectedModels: string[]
	activePromptId: string
	activeVersionId: string
	inputPromptContent: string
	hasValidKeyForModel: (modelId: string) => boolean
	onRunAllModels: (rowId: string, input: string) => void
	onRemoveRow: (rowId: string) => void
	onUpdateRowInput: (rowId: string, input: string) => void
	isFullScreen?: boolean
	onClose?: () => void
}

export default function ResponseTable({
	tableData,
	selectedModels,
	activePromptId,
	activeVersionId,
	inputPromptContent,
	hasValidKeyForModel,
	onRunAllModels,
	onRemoveRow,
	onUpdateRowInput,
	isFullScreen = false,
	onClose,
}: ResponseTableProps) {
	// Handle Escape key to close modal when in full-screen mode
	useEffect(() => {
		if (!isFullScreen) return

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && onClose) {
				onClose()
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => {
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isFullScreen, onClose])

	// Handle body scroll locking in full-screen mode
	useEffect(() => {
		if (!isFullScreen) return

		// Save current scroll position
		const scrollY = window.scrollY
		document.body.style.position = 'fixed'
		document.body.style.width = '100%'
		document.body.style.top = `-${scrollY}px`

		return () => {
			// Restore scroll position
			const scrollY = document.body.style.top
			document.body.style.position = ''
			document.body.style.width = ''
			document.body.style.top = ''
			window.scrollTo(0, parseInt(scrollY || '0') * -1)
		}
	}, [isFullScreen])

	const tableContent = (
		<div className="flex-1 overflow-auto bg-surface-card">
			<div className="overflow-x-auto min-w-full">
				<table
					className="w-full h-full border-collapse border border-neutral"
					style={{
						minWidth: `${
							isFullScreen
								? 400
								: 300 + selectedModels.length * (isFullScreen ? 400 : 300)
						}px`,
					}}
				>
					<thead className="sticky top-0">
						<tr>
							<th
								className="p-3 text-left text-sm font-semibold text-primary border-b border-r border-neutral"
								style={{
									width: isFullScreen ? '400px' : '300px',
									minWidth: isFullScreen ? '400px' : '300px',
								}}
							>
								Input
							</th>
							{selectedModels.map((modelId, index) => {
								const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
								return (
									<th
										key={modelId}
										className={`text-left text-sm font-semibold text-primary border-b border-neutral ${
											index < selectedModels.length - 1
												? 'border-r border-neutral'
												: ''
										}`}
										style={{
											width: isFullScreen ? '400px' : '300px',
											minWidth: isFullScreen ? '400px' : '300px',
										}}
									>
										<ModelItem
											model={model!}
											showStatus
											hasValidKey={hasValidKeyForModel(modelId)}
											className={'h-15 p-3'}
										/>
									</th>
								)
							})}
						</tr>
					</thead>
					<tbody>
						{tableData.map((row, rowIndex) => (
							<tr key={row.id}>
								<td
									className={`p-3 align-top border-r border-neutral ${
										rowIndex < tableData.length - 1 ? 'border-b' : ''
									}`}
									style={{
										width: isFullScreen ? '400px' : '300px',
										minWidth: isFullScreen ? '400px' : '300px',
									}}
								>
									<div className="space-y-3">
										<InputComponent
											value={row.input}
											onChange={(value: string) =>
												onUpdateRowInput(row.id, value)
											}
											placeholder="Enter your test input..."
											rows={isFullScreen ? 4 : 3}
										/>

										{/* Action Buttons */}
										<div className="flex gap-2">
											{/* Run All Models Button */}
											<button
												onClick={() => onRunAllModels(row.id, row.input)}
												disabled={!row.input.trim()}
												className={`px-3 py-1 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 ${
													isFullScreen ? 'text-sm' : 'text-xs'
												}`}
											>
												<PlayIcon
													className={`${isFullScreen ? 'w-4 h-4' : 'w-3 h-3'}`}
												/>
												Run All
											</button>

											{/* Remove Row Button */}
											{tableData.length > 1 && (
												<button
													onClick={() => onRemoveRow(row.id)}
													className={`px-3 py-1 border border-neutral text-primary hover:border-neutral-dark hover:bg-neutral-hover transition-colors ${
														isFullScreen ? 'text-sm' : 'text-xs'
													}`}
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
										style={{
											width: isFullScreen ? '400px' : '300px',
											minWidth: isFullScreen ? '400px' : '300px',
										}}
									>
										<TableCell
											key={`${row.id}-${modelId}-${
												row.responses[modelId] || 'empty'
											}`}
											rowId={row.id}
											modelId={modelId}
											input={row.input}
											systemPrompt={inputPromptContent}
											activePromptId={activePromptId}
											activeVersionId={activeVersionId}
											isFullScreen={isFullScreen}
										/>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)

	if (isFullScreen) {
		return (
			<div
				className="fixed inset-0 bg-black/90 flex flex-col z-50"
				onClick={onClose}
			>
				{/* Modal Header */}
				<div
					className="flex justify-between items-center px-5 py-3 bg-neutral-100"
					onClick={(e) => e.stopPropagation()}
				>
					<h2 className="text-lg font-semibold text-primary">All Responses</h2>
					<button
						onClick={onClose}
						className="text-secondary hover:text-primary"
					>
						<XMarkIcon className="w-6 h-6" />
					</button>
				</div>

				{/* Modal Content */}
				<div
					className="flex-1 overflow-auto bg-white"
					onClick={(e) => e.stopPropagation()}
				>
					{tableContent}
				</div>
			</div>
		)
	}

	return tableContent
}
