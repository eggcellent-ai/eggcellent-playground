import { useState, useEffect, useMemo } from 'react'
import { AVAILABLE_MODELS } from '../lib/stores'
import ModelModalHeader from './ModelModalHeader'
import ModelSearchBar from './ModelSearchBar'
import ModelProviderSection from './ModelProviderSection'
import ModelModalFooter from './ModelModalFooter'

interface ModelSelectionModalProps {
	isOpen: boolean
	onClose: () => void
	selectedModels: string[]
	onAddModel: (modelId: string) => void
}

// Provider icons - using emojis for now, can be replaced with actual SVG icons
const PROVIDER_ICONS: Record<string, string> = {
	openai: '🤖',
	anthropic: '🏛️',
	google: '🔍',
	xai: '🚀',
	mistral: '🌊',
	groq: '⚡',
	deepseek: '🌊',
	togetherai: '🤝',
	perplexity: '🔮',
}

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
	openai: 'Advanced language models including GPT-4 and o1',
	anthropic: 'Constitutional AI with Claude models',
	google: 'Gemini models with multimodal capabilities',
	xai: 'Grok models with real-time information',
	mistral: 'Efficient open-source language models',
	groq: 'Ultra-fast inference for open models',
	deepseek: 'Advanced reasoning and coding models',
	togetherai: 'Open-source models via API',
	perplexity: 'Search-augmented language models',
}

export default function ModelSelectionModal({
	isOpen,
	onClose,
	selectedModels,
	onAddModel,
}: ModelSelectionModalProps) {
	const [searchQuery, setSearchQuery] = useState('')

	// Group models by provider
	const modelsByProvider = useMemo(() => {
		const filtered = AVAILABLE_MODELS.filter(
			(model) =>
				!selectedModels.includes(model.id) &&
				(model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					model.provider.toLowerCase().includes(searchQuery.toLowerCase()))
		)

		const grouped: Record<string, Array<(typeof AVAILABLE_MODELS)[number]>> = {}
		filtered.forEach((model) => {
			if (!grouped[model.provider]) {
				grouped[model.provider] = []
			}
			grouped[model.provider].push(model)
		})

		return grouped
	}, [selectedModels, searchQuery])

	// Close on escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}

		if (isOpen) {
			document.addEventListener('keydown', handleEscape)
			document.body.style.overflow = 'hidden'
		}

		return () => {
			document.removeEventListener('keydown', handleEscape)
			document.body.style.overflow = 'unset'
		}
	}, [isOpen, onClose])

	// Reset search when modal opens
	useEffect(() => {
		if (isOpen) {
			setSearchQuery('')
		}
	}, [isOpen])

	if (!isOpen) return null

	const availableProviders = Object.keys(modelsByProvider).sort()
	const totalAvailableModels = Object.values(modelsByProvider).reduce(
		(sum, models) => sum + models.length,
		0
	)

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative min-h-screen flex items-center justify-center p-4">
				<div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
					{/* Header */}
					<ModelModalHeader onClose={onClose} />

					{/* Search Bar */}
					<ModelSearchBar
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						totalModels={totalAvailableModels}
						providerCount={availableProviders.length}
					/>

					{/* Models List */}
					<div className="flex-1 overflow-y-auto p-6">
						{totalAvailableModels === 0 ? (
							<div className="text-center py-12">
								<p className="text-text-secondary">
									{searchQuery
										? `No models found matching "${searchQuery}"`
										: 'All available models are already selected'}
								</p>
							</div>
						) : (
							<div className="space-y-6">
								{availableProviders.map((provider) => {
									const models = modelsByProvider[provider]
									return (
										<ModelProviderSection
											key={provider}
											provider={provider}
											models={models}
											onAddModel={onAddModel}
											providerIcon={PROVIDER_ICONS[provider] || '🤖'}
											providerDescription={
												PROVIDER_DESCRIPTIONS[provider] || 'Advanced AI models'
											}
										/>
									)
								})}
							</div>
						)}
					</div>

					{/* Footer */}
					<ModelModalFooter
						selectedCount={selectedModels.length}
						onClose={onClose}
					/>
				</div>
			</div>
		</div>
	)
}
