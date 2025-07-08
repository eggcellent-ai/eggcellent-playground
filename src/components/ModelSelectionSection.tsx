import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { AVAILABLE_MODELS } from '../lib/stores'
import { useAIService } from '../lib/aiService'
import ModelSelectionModal from './ModelSelectionModal'
import ModelItem from './ModelItem'

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

	return (
		<div>
			{/* Section Header */}
			<div className="bg-neutral-50 px-2 pb-2 pt-8">
				<h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
					Models
				</h2>
			</div>

			{/* Models Display */}
			<div>
				{selectedModels.length === 0 ? (
					<div className="text-center py-8 text-secondary">
						<p className="mb-4">No models selected</p>
						<button
							onClick={() => setShowModelModal(true)}
							className="px-4 py-2 bg-primary text-white text-sm transition-colors flex items-center gap-2 mx-auto"
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
								if (!model) return null

								return (
									<ModelItem
										key={modelId}
										model={model}
										showRemoveButton
										onRemove={() => onRemoveModel(modelId)}
										disableRemove={selectedModels.length <= 1}
										showStatus
										hasValidKey={hasValidKeyForModel(modelId)}
										className="border border-neutral"
									/>
								)
							})}
							<button
								onClick={() => setShowModelModal(true)}
								className="border border-neutral p-3 flex items-center justify-center gap-2 hover:border-secondary hover:bg-neutral-hover transition-colors text-secondary text-sm h-15"
							>
								<PlusIcon className="w-5 h-5" />
								<span>Add Model</span>
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
