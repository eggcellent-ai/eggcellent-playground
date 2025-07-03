import { useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { AVAILABLE_MODELS } from '../lib/stores'
import { useAIService } from '../lib/aiService'
import ModelSelectionModal from './ModelSelectionModal'

// Import logos
import googleLogo from '../assets/logos/google.svg'
// import openaiLogo from '../assets/logos/openai.svg'
// import anthropicLogo from '../assets/logos/anthropic.svg'
// import xaiLogo from '../assets/logos/xai.svg'
// import mistralLogo from '../assets/logos/mistral.svg'
// import groqLogo from '../assets/logos/groq.svg'
// import deepseekLogo from '../assets/logos/deepseek.svg'
// import togetherLogo from '../assets/logos/together.svg'
// import perplexityLogo from '../assets/logos/perplexity.svg'

const PROVIDER_LOGOS: Record<string, string> = {
	Google: googleLogo,
	// openai: openaiLogo,
	// anthropic: anthropicLogo,
	// xai: xaiLogo,
	// mistral: mistralLogo,
	// groq: groqLogo,
	// deepseek: deepseekLogo,
	// togetherai: togetherLogo,
	// perplexity: perplexityLogo,
}

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
										className="bg-surface-input border border-neutral p-4 flex items-start justify-between group relative"
									>
										<button
											onClick={() => onRemoveModel(modelId)}
											disabled={selectedModels.length <= 1}
											className="absolute inset-0 flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-0"
											title={
												selectedModels.length <= 1
													? 'Cannot remove the last model'
													: 'Remove model'
											}
										>
											<TrashIcon className="w-5 h-5" />
											<span className="text-sm font-medium">Remove</span>
										</button>
										<div className="flex gap-4 items-start justify-between w-full">
											<div className="flex gap-4 items-center">
												{model?.provider && PROVIDER_LOGOS[model.provider] && (
													<img
														src={PROVIDER_LOGOS[model.provider]}
														alt={`${model.provider} logo`}
														className="w-8 h-8 object-contain"
														onError={(e) => {
															// Hide the image if it fails to load
															;(e.target as HTMLImageElement).style.display =
																'none'
														}}
													/>
												)}
												<div>
													<div className="font-medium text-text-primary truncate">
														{model?.name || modelId}
													</div>
													<div className="text-xs text-text-secondary">
														{model?.provider}
													</div>
												</div>
											</div>
											{!status.hasValidKey && (
												<div className="mt-1 transition-opacity">
													<span
														className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${status.statusColor}`}
													>
														{status.statusText}
													</span>
												</div>
											)}
										</div>
									</div>
								)
							})}
							<button
								onClick={() => setShowModelModal(true)}
								className="border border-neutral p-3 flex items-center justify-center gap-2 hover:border-neutral-dark hover:bg-neutral-hover transition-colors text-text-secondary text-sm"
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
