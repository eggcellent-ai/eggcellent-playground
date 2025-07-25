import { useState, useMemo } from 'react'
import {
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

// Helper function to get average price for sorting/filtering
const getAveragePrice = (model: {
	inputPricePer1KToken?: number
	outputPricePer1KToken?: number
}): number => {
	const inputPrice = model.inputPricePer1KToken || 0
	const outputPrice = model.outputPricePer1KToken || 0
	return (inputPrice + outputPrice) / 2
}

// Helper function to get price range for a model based on average price
const getPriceRange = (model: {
	inputPricePer1KToken?: number
	outputPricePer1KToken?: number
}): string => {
	const avgPrice = getAveragePrice(model)
	if (avgPrice === 0) return 'unknown'
	if (avgPrice < 0.002) return '$'
	if (avgPrice <= 0.02) return '$$'
	return '$$$'
}

export default function ModelComparisonTable() {
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedProviders, setSelectedProviders] = useState<string[]>([])
	const [selectedStrengths, setSelectedStrengths] = useState<string[]>([])
	const [selectedLatency, setSelectedLatency] = useState<string[]>([])
	const [selectedQuality, setSelectedQuality] = useState<string[]>([])
	const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([])
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

	const allPriceRanges = useMemo(() => {
		return ['$', '$$', '$$$']
	}, [])

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

			// Price filter
			const matchesPriceRange =
				selectedPriceRanges.length === 0 ||
				selectedPriceRanges.includes(getPriceRange(model))

			return (
				matchesSearch &&
				matchesProvider &&
				matchesStrengths &&
				matchesLatency &&
				matchesQuality &&
				matchesPriceRange
			)
		})

		// Sort the filtered models
		return [...filtered].sort((a, b) => {
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
					aValue = getAveragePrice(a)
					bValue = getAveragePrice(b)
					break
				case 'inputPrice':
					aValue = a.inputPricePer1KToken || 0
					bValue = b.inputPricePer1KToken || 0
					break
				case 'outputPrice':
					aValue = a.outputPricePer1KToken || 0
					bValue = b.outputPricePer1KToken || 0
					break
				case 'priceRange':
					aValue = getPriceRange(a)
					bValue = getPriceRange(b)
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
	}, [
		searchQuery,
		selectedProviders,
		selectedStrengths,
		selectedLatency,
		selectedQuality,
		selectedPriceRanges,
		sortField,
		sortDirection,
	])

	// Format price for display (both input and output)
	const formatPrice = (model: {
		inputPricePer1KToken?: number
		outputPricePer1KToken?: number
	}) => {
		const inputPrice = model.inputPricePer1KToken
		const outputPrice = model.outputPricePer1KToken

		if (!inputPrice && !outputPrice) return 'N/A'

		const formatSinglePrice = (price: number) => `$${(price * 1000).toFixed(2)}`

		if (inputPrice && outputPrice) {
			return (
				<div className="text-xs">
					<div>In: {formatSinglePrice(inputPrice)}/1M</div>
					<div>Out: {formatSinglePrice(outputPrice)}/1M</div>
				</div>
			)
		}

		if (inputPrice) return `In: ${formatSinglePrice(inputPrice)}/1M tokens`
		if (outputPrice) return `Out: ${formatSinglePrice(outputPrice)}/1M tokens`

		return 'N/A'
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
			case 'priceRange':
				setSelectedPriceRanges((prev) =>
					prev.includes(value)
						? prev.filter((p) => p !== value)
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
		setSelectedPriceRanges([])
		setSearchQuery('')
	}

	return (
		<div className="min-h-screen py-10">
			<div className="flex items-center justify-between mb-6 px-6">
				<div>
					<h2 className="text-2xl font-semibold text-primary">
						Model Comparison Table
					</h2>
				</div>
			</div>
			<div className="mx-auto px-4">
				<div>
					{/* Search and Filters */}
					<div>
						<div className="flex gap-4 items-center mb-4">
							{/* Search */}
							<div className="relative flex-1 ">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<MagnifyingGlassIcon className="h-5 w-5 text-secondary" />
								</div>
								<input
									type="text"
									placeholder="Search models or providers..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-neutral focus:outline-none focus:border-secondary text-primary placeholder-text-muted bg-surface-card"
								/>
							</div>
							{/* Clear Filters */}
							{(selectedProviders.length > 0 ||
								selectedStrengths.length > 0 ||
								selectedLatency.length > 0 ||
								selectedQuality.length > 0 ||
								selectedPriceRanges.length > 0 ||
								searchQuery) && (
								<button
									onClick={clearFilters}
									className="px-4 py-2 text-secondary hover:bg-neutral-hover transition-colors border border-neutral"
								>
									Clear All
								</button>
							)}
						</div>
						{/* Filter Panel - always visible now */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 pt-4">
							{/* Provider Filter */}
							<div>
								<h4 className="font-medium text-primary mb-2">Provider</h4>
								<div className="flex flex-wrap gap-2">
									{allProviders.map((provider) => (
										<button
											key={provider}
											type="button"
											onClick={() => toggleFilter('provider', provider)}
											className={`px-3 py-1 rounded-full border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50
					${
						selectedProviders.includes(provider)
							? 'bg-primary text-white border-primary'
							: 'bg-white text-secondary border-neutral hover:bg-neutral-hover'
					}`}
										>
											{provider}
										</button>
									))}
								</div>
							</div>

							{/* Strengths Filter */}
							<div>
								<h4 className="font-medium text-primary mb-2">Strengths</h4>
								<div className="flex flex-wrap gap-2">
									{allStrengths.map((strength) => (
										<button
											key={strength}
											type="button"
											onClick={() => toggleFilter('strength', strength)}
											className={`px-3 py-1 rounded-full border text-sm capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50
					${
						selectedStrengths.includes(strength)
							? 'bg-primary text-white border-primary'
							: 'bg-white text-secondary border-neutral hover:bg-neutral-hover'
					}`}
										>
											{strength}
										</button>
									))}
								</div>
							</div>

							{/* Latency Filter */}
							<div>
								<h4 className="font-medium text-primary mb-2">Latency</h4>
								<div className="flex flex-wrap gap-2">
									{allLatency.map((latency) => (
										<button
											key={latency}
											type="button"
											onClick={() => toggleFilter('latency', latency)}
											className={`px-3 py-1 rounded-full border text-sm capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50
					${
						selectedLatency.includes(latency)
							? 'bg-primary text-white border-primary'
							: 'bg-white text-secondary border-neutral hover:bg-neutral-hover'
					}`}
										>
											{latency}
										</button>
									))}
								</div>
							</div>

							{/* Quality Filter */}
							<div>
								<h4 className="font-medium text-primary mb-2">Quality</h4>
								<div className="flex flex-wrap gap-2">
									{allQuality.map((quality) => (
										<button
											key={quality}
											type="button"
											onClick={() => toggleFilter('quality', quality)}
											className={`px-3 py-1 rounded-full border text-sm capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50
					${
						selectedQuality.includes(quality)
							? 'bg-primary text-white border-primary'
							: 'bg-white text-secondary border-neutral hover:bg-neutral-hover'
					}`}
										>
											{quality}
										</button>
									))}
								</div>
							</div>

							{/* Price Range Filter */}
							<div>
								<h4 className="font-medium text-primary mb-2">Price Range</h4>
								<div className="flex flex-wrap gap-2">
									{allPriceRanges.map((range) => (
										<button
											key={range}
											type="button"
											onClick={() => toggleFilter('priceRange', range)}
											className={`px-3 py-1 rounded-full border text-sm capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50
					${
						selectedPriceRanges.includes(range)
							? 'bg-primary text-white border-primary'
							: 'bg-white text-secondary border-neutral hover:bg-neutral-hover'
					}`}
										>
											{range}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
					{/* Table */}
					<div className="pb-2 px-1">
						<p className="text-sm text-secondary mt-1">
							{filteredModels.length} of {AVAILABLE_MODELS.length} models
						</p>
					</div>
					<div className="overflow-x-auto border border-neutral bg-surface-card">
						<table className="w-full border-collapse">
							<thead className="sticky top-0 border-b border-neutral">
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
											Price (Input/Output per 1M tokens)
											{sortField === 'pricePer1KToken' &&
												(sortDirection === 'asc' ? (
													<ChevronUpIcon className="w-4 h-4" />
												) : (
													<ChevronDownIcon className="w-4 h-4" />
												))}
										</div>
									</th>
									<th
										className="p-3 text-left text-sm font-semibold text-primary border-r border-neutral min-w-[120px] cursor-pointer hover:bg-neutral-hover transition-colors"
										onClick={() => handleSort('priceRange')}
									>
										<div className="flex items-center gap-2">
											Price Range
											{sortField === 'priceRange' &&
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
											index % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'
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
											{formatPrice(model)}
										</td>
										<td className="p-3 border-r border-neutral text-sm">
											<span
												className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
													getPriceRange(model) === '$'
														? 'bg-green-100 text-green-800'
														: getPriceRange(model) === '$$'
														? 'bg-yellow-100 text-yellow-800'
														: getPriceRange(model) === '$$$'
														? 'bg-red-100 text-red-800'
														: 'bg-gray-100 text-gray-800'
												}`}
											>
												{getPriceRange(model)}
											</span>
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
												{model.strengths && model.strengths.length > 0
													? model.strengths.map((strength: string) => (
															<span
																key={strength}
																className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
															>
																{strength}
															</span>
													  ))
													: 'N/A'}
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
	)
}
