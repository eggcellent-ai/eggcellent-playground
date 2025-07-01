import { useState, useEffect, useMemo } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { AVAILABLE_MODELS } from '../lib/stores'

interface ModelSelectionModalProps {
	isOpen: boolean
	onClose: () => void
	selectedModels: string[]
	onAddModel: (modelId: string) => void
}

// Provider Logo Components
const ProviderLogo = ({
	provider,
	className = 'w-6 h-6',
}: {
	provider: string
	className?: string
}) => {
	switch (provider) {
		case 'openai':
			return (
				<svg className={className} viewBox="0 0 24 24" fill="currentColor">
					<path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
				</svg>
			)
		case 'anthropic':
			return (
				<svg className={className} viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.596h-2.035l-1.071-2.678H9.212l-1.071 2.678H6.106L10.465 7.4h3.07l4.359 9.196zM12 9.108l-1.964 4.91h3.928L12 9.108z" />
				</svg>
			)
		case 'google':
			return (
				<svg className={className} viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						fill="#4285F4"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						fill="#34A853"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						fill="#FBBC05"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						fill="#EA4335"
					/>
				</svg>
			)
		case 'xai':
			return (
				<svg className={className} viewBox="0 0 24 24" fill="currentColor">
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
				</svg>
			)
		case 'mistral':
			return (
				<div
					className={`${className} bg-orange-500 rounded-sm flex items-center justify-center text-white font-bold text-xs`}
				>
					M
				</div>
			)
		case 'groq':
			return (
				<div
					className={`${className} bg-orange-600 rounded flex items-center justify-center text-white font-bold text-xs`}
				>
					G
				</div>
			)
		case 'deepseek':
			return (
				<div
					className={`${className} bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs`}
				>
					DS
				</div>
			)
		case 'togetherai':
			return (
				<div
					className={`${className} bg-purple-600 rounded flex items-center justify-center text-white font-bold text-xs`}
				>
					T
				</div>
			)
		case 'perplexity':
			return (
				<svg className={className} viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.182c5.423 0 9.818 4.395 9.818 9.818S17.423 21.818 12 21.818 2.182 17.423 2.182 12 6.577 2.182 12 2.182zm0 3.636a6.182 6.182 0 1 0 0 12.364A6.182 6.182 0 0 0 12 5.818zm0 2.182a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
				</svg>
			)
		default:
			return (
				<div
					className={`${className} bg-gray-500 rounded flex items-center justify-center text-white font-bold text-xs`}
				>
					AI
				</div>
			)
	}
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
							className="p-2 hover:bg-neutral-hover rounded-full transition-colors"
						>
							<XMarkIcon className="w-5 h-5 text-text-secondary" />
						</button>
					</div>

					{/* Search Bar */}
					<div className="p-6 border-b border-neutral">
						<div className="relative">
							<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
							<input
								type="text"
								placeholder="Search models or providers..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-3 border border-neutral rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary text-text-primary placeholder-text-muted"
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
												<ProviderLogo provider={provider} className="w-6 h-6" />
												<div>
													<h3 className="font-semibold text-text-primary capitalize">
														{provider === 'openai'
															? 'OpenAI'
															: provider === 'anthropic'
															? 'Anthropic'
															: provider === 'google'
															? 'Google'
															: provider === 'xai'
															? 'xAI'
															: provider === 'togetherai'
															? 'Together.ai'
															: provider.charAt(0).toUpperCase() +
															  provider.slice(1)}
													</h3>
													<p className="text-xs text-text-secondary">
														{PROVIDER_DESCRIPTIONS[provider] ||
															'Advanced AI models'}
													</p>
												</div>
												<div className="ml-auto">
													<span className="text-xs font-medium text-text-secondary bg-neutral-light px-2 py-1 rounded">
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
														className="p-4 border border-neutral rounded-lg hover:border-secondary hover:bg-secondary-light transition-all text-left group"
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
															<div className="ml-2 flex-shrink-0">
																<div className="w-8 h-8 bg-neutral-light rounded-full flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
																	<ProviderLogo
																		provider={provider}
																		className="w-4 h-4"
																	/>
																</div>
															</div>
														</div>

														{/* Model metadata */}
														<div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
															<span className="bg-neutral-light px-2 py-1 rounded">
																{provider === 'openai'
																	? 'OpenAI'
																	: provider === 'anthropic'
																	? 'Anthropic'
																	: provider === 'google'
																	? 'Google'
																	: provider === 'xai'
																	? 'xAI'
																	: provider === 'togetherai'
																	? 'Together.ai'
																	: provider.charAt(0).toUpperCase() +
																	  provider.slice(1)}
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
							className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors"
						>
							Done
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
