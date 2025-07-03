import { useState } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { AVAILABLE_MODELS } from '../lib/stores'
import { useAIService } from '../lib/aiService'
import ModelSelectionModal from './ModelSelectionModal'

interface ModelSelectionSectionProps {
	selectedModels: string[]
	onAddModel: (modelId: string) => void
	onRemoveModel: (modelId: string) => void
}

export default function ModelSelectionSection({
	selectedModels,
	onAddModel,
	onRemoveModel,
}: ModelSelectionSectionProps) {
	const [showModelModal, setShowModelModal] = useState(false)
	const { hasValidKeyForModel } = useAIService()

	const handleAddModel = (modelId: string) => {
		onAddModel(modelId)
		setShowModelModal(false)
	}

	const getModelStatus = (modelId: string) => {
		const hasValidKey = hasValidKeyForModel(modelId)
		return {
			hasValidKey,
			statusText: hasValidKey ? 'Ready' : 'API Key Required',
			statusColor: hasValidKey
				? 'bg-success-light text-success-dark'
				: 'bg-warning-light text-warning-dark',
		}
	}

	return (
		<div>
			{/* Section Header */}
			<div className="bg-neutral-50 px-2 pb-2 pt-8">
				<h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
					Models
				</h2>
			</div>

			{/* Models Display */}
			<div>
				{selectedModels.length === 0 ? (
					<div className="text-center py-8 text-text-secondary">
						<p className="mb-4">No models selected</p>
						<button
							onClick={() => setShowModelModal(true)}
							className="px-4 py-2 bg-primary text-white text-sm hover:bg-primary-dark transition-colors flex items-center gap-2 mx-auto"
						>
							<PlusIcon className="w-4 h-4" />
							Add Models
						</button>
					</div>
				) : (
					<div className="space-y-3">
						{/* Selected Models Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{selectedModels.map((modelId) => {
								const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
								const status = getModelStatus(modelId)

								return (
									<div
										key={modelId}
										className="bg-surface-input border border-neutral p-3 flex flex-col justify-between min-h-[140px]"
									>
										<div className="flex-1 min-w-0">
											<div className="font-medium text-text-primary truncate">
												{model?.name || modelId}
											</div>
											<div className="text-xs text-text-secondary">
												{model?.provider}
											</div>
											<div className="mt-1">
												<span
													className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${status.statusColor}`}
												>
													{status.statusText}
												</span>
											</div>
										</div>
										<div className="flex justify-end mt-2">
											<button
												onClick={() => onRemoveModel(modelId)}
												disabled={selectedModels.length <= 1}
												className="p-1 rounded-full text-text-secondary hover:text-error hover:bg-error-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												title={
													selectedModels.length <= 1
														? 'Cannot remove the last model'
														: 'Remove model'
												}
											>
												<XMarkIcon className="w-4 h-4" />
											</button>
										</div>
									</div>
								)
							})}
							<button
								onClick={() => setShowModelModal(true)}
								className="bg-surface-input border border-neutral p-3 flex flex-col items-center justify-center gap-2 hover:border-neutral-dark hover:bg-neutral-hover transition-colors text-text-secondary min-h-[140px]"
							>
								<div className="flex-1 min-w-0 flex flex-col items-center justify-center">
									<div className="font-medium text-text-primary">
										<PlusIcon className="w-6 h-6 mb-2" />
										<span>Add Model</span>
									</div>
									<div className="text-xs text-text-secondary mt-1">
										Add more AI models to compare
									</div>
								</div>
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Model Selection Modal */}
			<ModelSelectionModal
				isOpen={showModelModal}
				onClose={() => setShowModelModal(false)}
				selectedModels={selectedModels}
				onAddModel={handleAddModel}
			/>
		</div>
	)
}
