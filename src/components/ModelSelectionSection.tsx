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
					Models ({selectedModels.length})
				</h2>
			</div>

			{/* Models Display */}
			<div className="p-4 border border-neutral bg-surface-card">
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
										className="bg-surface-input border border-neutral p-3 flex items-center justify-between"
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
										<button
											onClick={() => onRemoveModel(modelId)}
											disabled={selectedModels.length <= 1}
											className="p-1 rounded-full text-text-secondary hover:text-error hover:bg-error-light transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
											title={
												selectedModels.length <= 1
													? 'Cannot remove the last model'
													: 'Remove model'
											}
										>
											<XMarkIcon className="w-4 h-4" />
										</button>
									</div>
								)
							})}
						</div>

						{/* Add Model Button */}
						<div className="flex justify-center pt-2">
							<button
								onClick={() => setShowModelModal(true)}
								className="px-4 py-2 border border-neutral text-text-secondary text-sm hover:border-neutral-dark hover:bg-neutral-hover transition-colors flex items-center gap-2"
							>
								<PlusIcon className="w-4 h-4" />
								Add More Models
							</button>
						</div>

						{/* Model Status Summary */}
						<div className="mt-4 p-3 bg-neutral-50 border border-neutral">
							<div className="text-xs text-text-secondary">
								<div className="flex items-center justify-between">
									<span>Total Models: {selectedModels.length}</span>
									<span>
										Ready: {selectedModels.filter(hasValidKeyForModel).length} /{' '}
										{selectedModels.length}
									</span>
								</div>
								{selectedModels.some(
									(modelId) => !hasValidKeyForModel(modelId)
								) && (
									<div className="mt-2 text-warning-dark">
										⚠️ Some models are missing API keys. Configure them in
										Settings.
									</div>
								)}
							</div>
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
