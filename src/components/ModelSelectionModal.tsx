import { useState, useEffect, useMemo } from 'react'
import { AVAILABLE_MODELS } from '../lib/stores'
import ModelItem from './ModelItem'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface ModelSelectionModalProps {
	isOpen: boolean
	onClose: () => void
	selectedModels: string[]
	onAddModel: (modelId: string) => void
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
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-neutral-hover rounded-full transition-colors"
						>
							<XMarkIcon className="w-5 h-5 text-text-secondary" />
						</button>
					</div>

					{/* Search Bar */}
					<div className="relative p-6">
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<MagnifyingGlassIcon className="h-5 w-5 text-text-secondary" />
							</div>
							<input
								type="text"
								placeholder="Search models or providers..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-3 border border-neutral focus:outline-none focus:border-secondary text-text-primary placeholder-text-muted"
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
											<h3 className="font-semibold text-text-primary capitalize pl-2">
												{provider}
											</h3>

											{/* Models Grid */}
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
												{models.map((model) => (
													<ModelItem
														key={model.id}
														model={model}
														onClick={() => {
															onAddModel(model.id)
															// Don't close modal, allow multiple selections
														}}
													/>
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
