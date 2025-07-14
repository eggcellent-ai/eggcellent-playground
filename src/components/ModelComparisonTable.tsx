import { useState, useMemo } from 'react'
import {
	XMarkIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
	ChevronUpIcon,
	ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { AVAILABLE_MODELS } from '../lib/stores'

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

interface ModelComparisonTableProps {
	isOpen: boolean
	onClose: () => void
}

export default function ModelComparisonTable({
	isOpen,
	onClose,
}: ModelComparisonTableProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedProviders, setSelectedProviders] = useState<string[]>([])
	const [selectedStrengths, setSelectedStrengths] = useState<string[]>([])
	const [selectedLatency, setSelectedLatency] = useState<string[]>([])
	const [selectedQuality, setSelectedQuality] = useState<string[]>([])
	const [showFilters, setShowFilters] = useState(false)
	const [sortField, setSortField] = useState<string>('name')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

	// Get all unique values for filters
	const allProviders = useMemo(() => {
		const providers = new Set(AVAILABLE_MODELS.map((model) => model.provider))
		return Array.from(providers).sort()
	}, [])

	const allStrengths = useMemo(() => {
		const strengths = new Set<string>()
		AVAILABLE_MODELS.forEach((model) => {
			model.strengths?.forEach((strength) => strengths.add(strength))
		})
		return Array.from(strengths).sort()
	}, [])

	const allLatency = useMemo(() => {
		const latency = new Set(
			AVAILABLE_MODELS.map((model) => model.latency).filter(
				(l): l is 'low' | 'medium' | 'high' => Boolean(l)
			)
		)
		return Array.from(latency).sort()
	}, [])

	const allQuality = useMemo(() => {
		const quality = new Set(
			AVAILABLE_MODELS.map((model) => model.quality).filter(
				(q): q is 'low' | 'medium' | 'high' => Boolean(q)
			)
		)
		return Array.from(quality).sort()
	}, [])

	// Sort function
	const sortModels = (models: typeof AVAILABLE_MODELS) => {
		return [...models].sort((a, b) => {
			let aValue: string | number
			let bValue: string | number

			switch (sortField) {
				case 'name':
					aValue = a.name.toLowerCase()
					bValue = b.name.toLowerCase()
					break

				case 'contextWindow':
					aValue = a.contextWindow || 0
					bValue = b.contextWindow || 0
					break
				case 'pricePer1KToken':
					aValue = a.pricePer1KToken || 0
					bValue = b.pricePer1KToken || 0
					break
				case 'latency':
					aValue = a.latency || ''
					bValue = b.latency || ''
					break
				case 'quality':
					aValue = a.quality || ''
					bValue = b.quality || ''
					break
				case 'strengths':
					aValue = a.strengths?.length || 0
					bValue = b.strengths?.length || 0
					break
				case 'supportsImageInput':
					aValue = a.supportsImageInput ? 1 : 0
					bValue = b.supportsImageInput ? 1 : 0
					break
				case 'supportsObjectGeneration':
					aValue = a.supportsObjectGeneration ? 1 : 0
					bValue = b.supportsObjectGeneration ? 1 : 0
					break
				case 'supportsToolUsage':
					aValue = a.supportsToolUsage ? 1 : 0
					bValue = b.supportsToolUsage ? 1 : 0
					break
				case 'supportsToolStreaming':
					aValue = a.supportsToolStreaming ? 1 : 0
					bValue = b.supportsToolStreaming ? 1 : 0
					break
				case 'isMultimodal':
					aValue = a.isMultimodal ? 1 : 0
					bValue = b.isMultimodal ? 1 : 0
					break
				default:
					aValue = a.name.toLowerCase()
					bValue = b.name.toLowerCase()
			}

			if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
			if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
			return 0
		})
	}

	// Handle sort column click
	const handleSort = (field: string) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('asc')
		}
	}

	// Filter models based on search and filters
	const filteredModels = useMemo(() => {
		const filtered = AVAILABLE_MODELS.filter((model) => {
			// Search filter
			const matchesSearch =
				!searchQuery ||
				model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				model.provider.toLowerCase().includes(searchQuery.toLowerCase())

			// Provider filter
			const matchesProvider =
				selectedProviders.length === 0 ||
				selectedProviders.includes(model.provider)

			// Strengths filter
			const matchesStrengths =
				selectedStrengths.length === 0 ||
				selectedStrengths.some((strength) =>
					model.strengths?.includes(strength)
				)

			// Latency filter
			const matchesLatency =
				selectedLatency.length === 0 ||
				(model.latency && selectedLatency.includes(model.latency))

			// Quality filter
			const matchesQuality =
				selectedQuality.length === 0 ||
				(model.quality && selectedQuality.includes(model.quality))

			return (
				matchesSearch &&
				matchesProvider &&
				matchesStrengths &&
				matchesLatency &&
				matchesQuality
			)
		})

		return sortModels(filtered)
	}, [
		searchQuery,
		selectedProviders,
		selectedStrengths,
		selectedLatency,
		selectedQuality,
		sortField,
		sortDirection,
	])

	// Format price for display
	const formatPrice = (price?: number) => {
		if (!price) return 'N/A'
		return `$${(price * 1000).toFixed(2)}/1M tokens`
	}

	// Format context window for display
	const formatContextWindow = (contextWindow?: number) => {
		if (!contextWindow) return 'N/A'
		if (contextWindow >= 1000000) {
			return `${(contextWindow / 1000000).toFixed(1)}M`
		}
		if (contextWindow >= 1000) {
			return `${(contextWindow / 1000).toFixed(0)}K`
		}
		return contextWindow.toString()
	}

	// Toggle filter values
	const toggleFilter = (filterType: string, value: string) => {
		switch (filterType) {
			case 'provider':
				setSelectedProviders((prev) =>
					prev.includes(value)
						? prev.filter((p) => p !== value)
						: [...prev, value]
				)
				break
			case 'strength':
				setSelectedStrengths((prev) =>
					prev.includes(value)
						? prev.filter((s) => s !== value)
						: [...prev, value]
				)
				break
			case 'latency':
				setSelectedLatency((prev) =>
					prev.includes(value)
						? prev.filter((l) => l !== value)
						: [...prev, value]
				)
				break
			case 'quality':
				setSelectedQuality((prev) =>
					prev.includes(value)
						? prev.filter((q) => q !== value)
						: [...prev, value]
				)
				break
		}
	}

	// Clear all filters
	const clearFilters = () => {
		setSelectedProviders([])
		setSelectedStrengths([])
		setSelectedLatency([])
		setSelectedQuality([])
		setSearchQuery('')
	}

	if (!isOpen) return null

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
					className="relative bg-white shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col"
					onClick={(e) => e.stopPropagation()}
					onMouseDown={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-neutral">
						<div>
							<h2 className="text-xl font-semibold text-primary">
								Model Comparison Table
							</h2>
							<p className="text-sm text-secondary mt-1">
								{filteredModels.length} of {AVAILABLE_MODELS.length} models
							</p>
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-neutral-hover rounded-full transition-colors"
						>
							<XMarkIcon className="w-5 h-5 text-secondary" />
						</button>
					</div>

					{/* Search and Filters */}
					<div className="p-6 border-b border-neutral">
						<div className="flex gap-4 items-center mb-4">
							{/* Search */}
							<div className="relative flex-1">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<MagnifyingGlassIcon className="h-5 w-5 text-secondary" />
								</div>
								<input
									type="text"
									placeholder="Search models or providers..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-neutral focus:outline-none focus:border-secondary text-primary placeholder-text-muted"
								/>
							</div>

							{/* Filter Toggle */}
							<button
								onClick={() => setShowFilters(!showFilters)}
								className={`px-4 py-2 flex items-center gap-2 border rounded transition-colors ${
									showFilters
										? 'bg-primary text-white border-primary'
										: 'border-neutral text-secondary hover:border-secondary'
								}`}
							>
								<FunnelIcon className="w-4 h-4" />
								Filters
							</button>

							{/* Clear Filters */}
							{(selectedProviders.length > 0 ||
								selectedStrengths.length > 0 ||
								selectedLatency.length > 0 ||
								selectedQuality.length > 0 ||
								searchQuery) && (
								<button
									onClick={clearFilters}
									className="px-4 py-2 text-secondary hover:bg-neutral-hover rounded transition-colors"
								>
									Clear All
								</button>
							)}
						</div>

						{/* Filter Panel */}
						{showFilters && (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-neutral">
								{/* Provider Filter */}
								<div>
									<h4 className="font-medium text-primary mb-2">Provider</h4>
									<div className="space-y-1">
										{allProviders.map((provider) => (
											<label
												key={provider}
												className="flex items-center gap-2 text-sm"
											>
												<input
													type="checkbox"
													checked={selectedProviders.includes(provider)}
													onChange={() => toggleFilter('provider', provider)}
													className="rounded border-neutral"
												/>
												<span className="text-secondary">{provider}</span>
											</label>
										))}
									</div>
								</div>

								{/* Strengths Filter */}
								<div>
									<h4 className="font-medium text-primary mb-2">Strengths</h4>
									<div className="space-y-1">
										{allStrengths.map((strength) => (
											<label
												key={strength}
												className="flex items-center gap-2 text-sm"
											>
												<input
													type="checkbox"
													checked={selectedStrengths.includes(strength)}
													onChange={() => toggleFilter('strength', strength)}
													className="rounded border-neutral"
												/>
												<span className="text-secondary capitalize">
													{strength}
												</span>
											</label>
										))}
									</div>
								</div>

								{/* Latency Filter */}
								<div>
									<h4 className="font-medium text-primary mb-2">Latency</h4>
									<div className="space-y-1">
										{allLatency.map((latency) => (
											<label
												key={latency}
												className="flex items-center gap-2 text-sm"
											>
												<input
													type="checkbox"
													checked={selectedLatency.includes(latency)}
													onChange={() => toggleFilter('latency', latency)}
													className="rounded border-neutral"
												/>
												<span className="text-secondary capitalize">
													{latency}
												</span>
											</label>
										))}
									</div>
								</div>

								{/* Quality Filter */}
								<div>
									<h4 className="font-medium text-primary mb-2">Quality</h4>
									<div className="space-y-1">
										{allQuality.map((quality) => (
											<label
												key={quality}
												className="flex items-center gap-2 text-sm"
											>
												<input
													type="checkbox"
													checked={selectedQuality.includes(quality)}
													onChange={() => toggleFilter('quality', quality)}
													className="rounded border-neutral"
												/>
												<span className="text-secondary capitalize">
													{quality}
												</span>
											</label>
										))}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Table */}
					<div className="flex-1 overflow-auto">
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead className="sticky top-0 bg-white border-b border-neutral">
									<tr>
										<th
											className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[200px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('name')}
										>
											<div className="flex items-center gap-2">
												Model
												{sortField === 'name' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>

										<th
											className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[120px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('contextWindow')}
										>
											<div className="flex items-center gap-2">
												Context Window
												{sortField === 'contextWindow' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>
										<th
											className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[150px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('pricePer1KToken')}
										>
											<div className="flex items-center gap-2">
												Price (1M tokens)
												{sortField === 'pricePer1KToken' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>
										<th
											className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[100px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('latency')}
										>
											<div className="flex items-center gap-2">
												Latency
												{sortField === 'latency' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>
										<th
											className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[100px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('quality')}
										>
											<div className="flex items-center gap-2">
												Quality
												{sortField === 'quality' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>
										<th
											className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[200px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('strengths')}
										>
											<div className="flex items-center gap-2">
												Strengths
												{sortField === 'strengths' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>
										<th
											className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[100px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('supportsImageInput')}
										>
											<div className="flex items-center gap-2">
												Image Input
												{sortField === 'supportsImageInput' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>
										<th
											className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[120px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('supportsObjectGeneration')}
										>
											<div className="flex items-center gap-2">
												Object Gen
												{sortField === 'supportsObjectGeneration' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>
										<th
											className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[100px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('supportsToolUsage')}
										>
											<div className="flex items-center gap-2">
												Tools
												{sortField === 'supportsToolUsage' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>
										<th
											className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[120px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('supportsToolStreaming')}
										>
											<div className="flex items-center gap-2">
												Tool Stream
												{sortField === 'supportsToolStreaming' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>
										<th
											className="p-3 text-left text-sm font-semibold text-primary min-w-[100px] cursor-pointer hover:bg-neutral-hover transition-colors"
											onClick={() => handleSort('isMultimodal')}
										>
											<div className="flex items-center gap-2">
												Multimodal
												{sortField === 'isMultimodal' &&
													(sortDirection === 'asc' ? (
														<ChevronUpIcon className="w-4 h-4" />
													) : (
														<ChevronDownIcon className="w-4 h-4" />
													))}
											</div>
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredModels.map((model, index) => (
										<tr
											key={model.id}
											className={`border-b border-neutral hover:bg-neutral-hover transition-colors ${
												index % 2 === 0 ? 'bg-white' : 'bg-neutral-light'
											}`}
										>
											<td className="p-3 border-r border-neutral">
												<div className="flex items-center gap-3">
													{PROVIDER_LOGOS[model.provider] && (
														<img
															src={PROVIDER_LOGOS[model.provider]}
															alt={`${model.provider} logo`}
															className="w-6 h-6 object-contain"
														/>
													)}
													<div>
														<div className="font-medium text-primary text-sm">
															{model.name}
														</div>
														<div className="text-xs text-secondary">
															{model.id}
														</div>
													</div>
												</div>
											</td>

											<td className="p-3 border-r border-neutral text-sm text-secondary">
												{formatContextWindow(model.contextWindow)}
											</td>
											<td className="p-3 border-r border-neutral text-sm text-secondary">
												{formatPrice(model.pricePer1KToken)}
											</td>
											<td className="p-3 border-r border-neutral text-sm">
												<span
													className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
														model.latency === 'low'
															? 'bg-green-100 text-green-800'
															: model.latency === 'medium'
															? 'bg-yellow-100 text-yellow-800'
															: model.latency === 'high'
															? 'bg-red-100 text-red-800'
															: 'bg-gray-100 text-gray-800'
													}`}
												>
													{model.latency || 'N/A'}
												</span>
											</td>
											<td className="p-3 border-r border-neutral text-sm">
												<span
													className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
														model.quality === 'high'
															? 'bg-green-100 text-green-800'
															: model.quality === 'medium'
															? 'bg-yellow-100 text-yellow-800'
															: model.quality === 'low'
															? 'bg-red-100 text-red-800'
															: 'bg-gray-100 text-gray-800'
													}`}
												>
													{model.quality || 'N/A'}
												</span>
											</td>
											<td className="p-3 border-r border-neutral text-sm">
												<div className="flex flex-wrap gap-1">
													{model.strengths?.map((strength) => (
														<span
															key={strength}
															className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
														>
															{strength}
														</span>
													)) || 'N/A'}
												</div>
											</td>
											<td className="p-3 border-r border-neutral text-sm">
												<span
													className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
														model.supportsImageInput
															? 'bg-green-100 text-green-800'
															: 'bg-gray-100 text-gray-800'
													}`}
												>
													{model.supportsImageInput ? 'Yes' : 'No'}
												</span>
											</td>
											<td className="p-3 border-r border-neutral text-sm">
												<span
													className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
														model.supportsObjectGeneration
															? 'bg-green-100 text-green-800'
															: 'bg-gray-100 text-gray-800'
													}`}
												>
													{model.supportsObjectGeneration ? 'Yes' : 'No'}
												</span>
											</td>
											<td className="p-3 border-r border-neutral text-sm">
												<span
													className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
														model.supportsToolUsage
															? 'bg-green-100 text-green-800'
															: 'bg-gray-100 text-gray-800'
													}`}
												>
													{model.supportsToolUsage ? 'Yes' : 'No'}
												</span>
											</td>
											<td className="p-3 border-r border-neutral text-sm">
												<span
													className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
														model.supportsToolStreaming
															? 'bg-green-100 text-green-800'
															: 'bg-gray-100 text-gray-800'
													}`}
												>
													{model.supportsToolStreaming ? 'Yes' : 'No'}
												</span>
											</td>
											<td className="p-3 text-sm">
												<span
													className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
														model.isMultimodal
															? 'bg-green-100 text-green-800'
															: 'bg-gray-100 text-gray-800'
													}`}
												>
													{model.isMultimodal ? 'Yes' : 'No'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
