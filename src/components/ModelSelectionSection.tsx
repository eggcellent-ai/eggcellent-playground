import { useState } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { AVAILABLE_MODELS } from '../lib/stores'
import { useAIService } from '../lib/aiService'
import ModelSelectionModal from './ModelSelectionModal'

// Import provider logos as URLs
import OpenAILogo from '../assets/logos/openai.svg?url'
import AnthropicLogo from '../assets/logos/anthropic.svg?url'
import XAILogo from '../assets/logos/xai.svg?url'
import GoogleLogo from '../assets/logos/google.svg?url'
import MistralLogo from '../assets/logos/mistral.svg?url'
import GroqLogo from '../assets/logos/groq.svg?url'
import DeepSeekLogo from '../assets/logos/deepseek.svg?url'
import TogetherLogo from '../assets/logos/together.svg?url'
import PerplexityLogo from '../assets/logos/perplexity.svg?url'

interface ModelSelectionSectionProps {
	selectedModels: string[]
	onAddModel: (modelId: string) => void
	onRemoveModel: (modelId: string) => void
}

// Provider logo mapping
const PROVIDER_LOGOS: Record<string, string> = {
	OpenAI: OpenAILogo,
	Anthropic: AnthropicLogo,
	xAI: XAILogo,
	Google: GoogleLogo,
	Mistral: MistralLogo,
	Groq: GroqLogo,
	DeepSeek: DeepSeekLogo,
	'Together.ai': TogetherLogo,
	Perplexity: PerplexityLogo,
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

	const handleRemoveModel = (modelId: string) => {
		onRemoveModel(modelId)
	}

	const readyModels = selectedModels.filter((modelId) =>
		hasValidKeyForModel(modelId)
	)

	return (
		<div className="bg-neutral-50 border-b border-neutral">
			{/* Section Header */}
			<div className="px-4 py-3 border-b border-neutral">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
						Models
					</h2>
					<div className="flex items-center gap-2 text-xs text-text-secondary">
						<span>
							{selectedModels.length} total • {readyModels.length} ready
						</span>
						<button
							onClick={() => setShowModelModal(true)}
							className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-primary bg-white border border-neutral rounded-md hover:bg-neutral-50 transition-colors"
						>
							<PlusIcon className="h-3 w-3" />
							Add Model
						</button>
					</div>
				</div>
			</div>

			{/* Model Grid */}
			<div className="p-4">
				{selectedModels.length === 0 ? (
					<div className="text-center py-8 text-text-secondary">
						<p>No models selected</p>
						<button
							onClick={() => setShowModelModal(true)}
							className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-text-primary bg-white border border-neutral rounded-md hover:bg-neutral-50 transition-colors"
						>
							<PlusIcon className="h-4 w-4" />
							Add Your First Model
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
						{selectedModels.map((modelId) => {
							const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
							if (!model) return null

							const isReady = hasValidKeyForModel(modelId)
							const providerLogo = PROVIDER_LOGOS[model.provider]

							return (
								<div
									key={modelId}
									className="relative bg-white border border-neutral rounded-lg p-3 hover:shadow-sm transition-shadow"
								>
									{/* Remove button */}
									<button
										onClick={() => handleRemoveModel(modelId)}
										className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
									>
										<XMarkIcon className="h-3 w-3" />
									</button>

									{/* Provider logo and model info */}
									<div className="flex items-start gap-3">
										{providerLogo && (
											<img
												src={providerLogo}
												alt={`${model.provider} logo`}
												className="w-8 h-8 flex-shrink-0 rounded-sm object-contain"
											/>
										)}
										<div className="flex-1 min-w-0">
											<h3 className="font-medium text-text-primary text-sm truncate">
												{model.name}
											</h3>
											<p className="text-xs text-text-secondary truncate">
												{model.provider}
											</p>
										</div>
									</div>

									{/* Status indicator */}
									<div className="mt-3 flex items-center gap-1">
										<div
											className={`w-2 h-2 rounded-full ${
												isReady ? 'bg-green-500' : 'bg-red-500'
											}`}
										/>
										<span
											className={`text-xs font-medium ${
												isReady ? 'text-green-600' : 'text-red-600'
											}`}
										>
											{isReady ? 'Ready' : 'API Key Required'}
										</span>
									</div>
								</div>
							)
						})}
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
