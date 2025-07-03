import { useState, useEffect, useMemo } from 'react'
import { AVAILABLE_MODELS } from '../lib/stores'

interface ModelSelectionModalProps {
	isOpen: boolean
	onClose: () => void
	selectedModels: string[]
	onAddModel: (modelId: string) => void
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
		<div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 transition-opacity"
				aria-hidden="true"
			/>

			{/* Modal */}
			<div className="relative min-h-screen flex items-center justify-center p-4">
				<div
					className="relative bg-white shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
					onClick={(e) => e.stopPropagation()}
					onMouseDown={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-neutral">
						<div>
							<h2 className="text-xl font-semibold text-text-primary">
								Select AI Models
							</h2>
							<p className="text-sm text-text-secondary mt-1">
								{totalAvailableModels} models available across{' '}
								{availableProviders.length} providers
							</p>
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-neutral-hover transition-colors"
						>
							<span className="text-text-secondary">✕</span>
						</button>
					</div>

					{/* Search Bar */}
					<div className="p-6 border-b border-neutral">
						<div className="relative">
							<input
								type="text"
								placeholder="Search models or providers..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-4 pr-4 py-3 border border-neutral focus:outline-none focus:border-secondary text-text-primary placeholder-text-muted"
								autoFocus
							/>
						</div>
					</div>

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
									if (!models || models.length === 0) return null

									return (
										<div key={provider} className="space-y-3">
											{/* Provider Header */}
											<div className="flex items-center gap-3 pb-2 border-b border-neutral-light">
												<div>
													<h3 className="font-semibold text-text-primary capitalize">
														{provider}
													</h3>
													<p className="text-xs text-text-secondary">
														{PROVIDER_DESCRIPTIONS[provider] ||
															'Advanced AI models'}
													</p>
												</div>
												<div className="ml-auto">
													<span className="text-xs font-medium text-text-secondary bg-neutral-light px-2 py-1">
														{models.length} model
														{models.length !== 1 ? 's' : ''}
													</span>
												</div>
											</div>

											{/* Models Grid */}
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
												{models.map((model) => (
													<button
														key={model.id}
														onClick={() => {
															onAddModel(model.id)
															// Don't close modal, allow multiple selections
														}}
														className="p-4 border border-neutral hover:border-secondary hover:bg-secondary-light transition-all text-left group"
													>
														<div className="flex items-start justify-between">
															<div className="flex-1 min-w-0">
																<h4 className="font-medium text-text-primary group-hover:text-secondary truncate">
																	{model.name}
																</h4>
																<p className="text-xs text-text-secondary mt-1 line-clamp-2">
																	Advanced AI model
																</p>
															</div>
														</div>

														{/* Model metadata */}
														<div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
															<span className="bg-neutral-light px-2 py-1">
																{provider}
															</span>
														</div>
													</button>
												))}
											</div>
										</div>
									)
								})}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between p-6 border-t border-neutral bg-neutral-50">
						<div className="text-sm text-text-secondary">
							{selectedModels.length} model
							{selectedModels.length !== 1 ? 's' : ''} currently selected
						</div>
						<button
							onClick={onClose}
							className="px-4 py-2 bg-secondary text-white hover:bg-secondary-dark transition-colors"
						>
							Done
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
