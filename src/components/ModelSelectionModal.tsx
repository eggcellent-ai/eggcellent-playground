import { useState, useEffect, useMemo } from 'react'
import { AVAILABLE_MODELS } from '../lib/stores'
import ModelItem from './ModelItem'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

// Import provider logos
import googleLogo from '../assets/logos/google.svg'
import openaiLogo from '../assets/logos/openai.svg'
import anthropicLogo from '../assets/logos/anthropic.svg'
import xaiLogo from '../assets/logos/grok.svg'

const PROVIDER_LOGOS: Record<string, string> = {
	Google: googleLogo,
	OpenAI: openaiLogo,
	Anthropic: anthropicLogo,
	xAI: xaiLogo,
}

interface ModelSelectionModalProps {
	isOpen: boolean
	onClose: () => void
	selectedModels: string[]
	onAddModel: (modelIds: string[]) => void
}

export default function ModelSelectionModal({
	isOpen,
	onClose,
	selectedModels,
	onAddModel,
}: ModelSelectionModalProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [tempSelectedModels, setTempSelectedModels] = useState<string[]>([])

	// Reset temp selections when modal opens
	useEffect(() => {
		if (isOpen) {
			setSearchQuery('')
			setTempSelectedModels([...selectedModels]) // Initialize with current selections
		}
	}, [isOpen, selectedModels])

	// Group models by provider
	const modelsByProvider = useMemo(() => {
		const filtered = AVAILABLE_MODELS.filter(
			(model) =>
				model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				model.provider.toLowerCase().includes(searchQuery.toLowerCase())
		)

		const grouped: Record<string, Array<(typeof AVAILABLE_MODELS)[number]>> = {}
		filtered.forEach((model) => {
			if (!grouped[model.provider]) {
				grouped[model.provider] = []
			}
			grouped[model.provider].push(model)
		})

		return grouped
	}, [searchQuery])

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

	if (!isOpen) return null

	const availableProviders = Object.keys(modelsByProvider).sort()
	const totalAvailableModels = Object.values(modelsByProvider).reduce(
		(sum, models) => sum + models.length,
		0
	)

	const handleModelClick = (modelId: string) => {
		setTempSelectedModels((prev) => {
			if (prev.includes(modelId)) {
				return prev.filter((id) => id !== modelId)
			}
			return [...prev, modelId]
		})
	}

	const handleConfirm = () => {
		onAddModel(tempSelectedModels)
		onClose()
	}

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
					className="relative bg-white shadow-xl w-full max-h-[90vh] flex flex-col"
					onClick={(e) => e.stopPropagation()}
					onMouseDown={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-neutral">
						<div>
							<h2 className="text-xl font-semibold text-primary">
								Select AI Models
							</h2>
							{tempSelectedModels.length > 0 && (
								<p className="text-sm text-secondary mt-1">
									{tempSelectedModels.length} model
									{tempSelectedModels.length !== 1 ? 's' : ''} selected
								</p>
							)}
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-neutral-hover rounded-full transition-colors"
						>
							<XMarkIcon className="w-5 h-5 text-secondary" />
						</button>
					</div>

					{/* Search Bar */}
					<div className="relative p-6">
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<MagnifyingGlassIcon className="h-5 w-5 text-secondary" />
							</div>
							<input
								type="text"
								placeholder="Search models or providers..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								id="model-search"
								name="model-search"
								className="w-full pl-10 pr-4 py-3 border border-neutral focus:outline-none focus:border-secondary text-primary placeholder-text-muted"
								autoFocus
							/>
						</div>
					</div>

					{/* Models List */}
					<div className="flex-1 overflow-y-auto p-6">
						{totalAvailableModels === 0 ? (
							<div className="text-center py-12">
								<p className="text-secondary">
									No models found matching "{searchQuery}"
								</p>
							</div>
						) : (
							<div className="space-y-8">
								{availableProviders.map((provider) => {
									const models = modelsByProvider[provider]
									if (!models || models.length === 0) return null

									return (
										<div key={provider} className="space-y-4">
											{/* Provider Header */}
											<div className="flex items-center gap-3 pl-2">
												{PROVIDER_LOGOS[provider] && (
													<img
														src={PROVIDER_LOGOS[provider]}
														alt={`${provider} logo`}
														className="w-8 h-8 object-contain"
													/>
												)}
												<h3 className="font-semibold text-primary text-lg capitalize">
													{provider}
												</h3>
												<span className="text-sm text-secondary">
													({models.length} models)
												</span>
											</div>

											{/* Models Grid */}
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
												{models.map((model) => (
													<ModelItem
														key={model.id}
														model={model}
														showLogo={false}
														className="border border-neutral"
														onClick={() => handleModelClick(model.id)}
														selected={tempSelectedModels.includes(model.id)}
													/>
												))}
											</div>
										</div>
									)
								})}
							</div>
						)}
					</div>

					{/* Footer with Confirm Button */}
					<div className="border-t border-neutral p-6 flex justify-end gap-3">
						<button
							onClick={onClose}
							className="px-4 py-2 text-secondary hover:bg-neutral-hover rounded transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleConfirm}
							className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
						>
							Confirm Selection
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
