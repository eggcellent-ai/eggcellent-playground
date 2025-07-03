import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { AVAILABLE_MODELS } from '../lib/stores'
import type { UploadedImage } from './InputComponent'

interface TableRowData {
	id: string
	input: string
	images: UploadedImage[]
	timestamp: number
	responses: Record<string, string>
}

interface FullScreenResponseViewProps {
	isOpen: boolean
	onClose: () => void
	tableData: TableRowData[]
	selectedModels: string[]
}

export default function FullScreenResponseView({
	isOpen,
	onClose,
	tableData,
	selectedModels,
}: FullScreenResponseViewProps) {
	// Handle Escape key to close modal
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleEscape)
		}

		return () => {
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen, onClose])

	if (!isOpen) return null

	return (
		<div
			className="fixed inset-0 bg-black/90 flex flex-col z-50"
			onClick={onClose}
		>
			{/* Modal Header */}
			<div
				className="flex justify-between items-center p-4 bg-neutral-100 border-b border-neutral"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-xl font-semibold text-text-primary">
					All Responses - Full Screen View
				</h2>
				<button
					onClick={onClose}
					className="text-text-secondary hover:text-text-primary p-2"
				>
					<XMarkIcon className="w-6 h-6" />
				</button>
			</div>

			{/* Modal Content */}
			<div
				className="flex-1 overflow-auto bg-white"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-6">
					{/* Render each input row with all model responses horizontally */}
					{tableData
						.filter(
							(row) =>
								row.input.trim() ||
								(row.images || []).length > 0 ||
								selectedModels.some((modelId) => row.responses[modelId]?.trim())
						)
						.map((row, rowIndex) => (
							<div
								key={row.id}
								className={`mb-8 ${
									rowIndex < tableData.length - 1
										? 'border-b border-neutral-200 pb-8'
										: ''
								}`}
							>
								{/* Input Section */}
								<div className="mb-4">
									<h3 className="text-lg font-medium text-text-primary mb-2">
										Input {rowIndex + 1}
									</h3>
									<div className="bg-neutral-50 p-4">
										{row.input && (
											<div className="whitespace-pre-wrap text-text-primary mb-2">
												{row.input}
											</div>
										)}
										{(row.images || []).length > 0 && (
											<div className="text-sm text-text-secondary">
												📎 {(row.images || []).length} image(s) attached
											</div>
										)}
									</div>
								</div>

								{/* Responses Section - Horizontal Layout */}
								<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
									{selectedModels.map((modelId) => {
										const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
										const response = row.responses[modelId] || ''

										return (
											<div
												key={modelId}
												className="bg-surface-card border border-neutral overflow-hidden"
											>
												{/* Model Header */}
												<div className="bg-neutral-100 px-4 py-2 border-b border-neutral">
													<h4 className="font-medium text-text-primary">
														{model?.name || modelId}
													</h4>
													<p className="text-xs text-text-secondary">
														{model?.provider}
													</p>
												</div>

												{/* Response Content */}
												<div className="p-4">
													{response ? (
														<div className="whitespace-pre-wrap text-text-primary text-sm leading-relaxed max-h-96 overflow-y-auto">
															{response}
														</div>
													) : (
														<div className="text-muted text-sm italic">
															No response yet
														</div>
													)}
												</div>
											</div>
										)
									})}
								</div>
							</div>
						))}

					{/* Empty State */}
					{!tableData.some(
						(row) =>
							row.input.trim() ||
							(row.images || []).length > 0 ||
							selectedModels.some((modelId) => row.responses[modelId]?.trim())
					) && (
						<div className="text-center text-muted py-12">
							<h3 className="text-lg font-medium mb-2">No Data to Display</h3>
							<p>Add some inputs and run the table to see responses here.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
