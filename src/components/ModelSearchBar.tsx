import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface ModelSearchBarProps {
	searchQuery: string
	onSearchChange: (query: string) => void
	totalModels: number
	providerCount: number
}

export default function ModelSearchBar({
	searchQuery,
	onSearchChange,
	totalModels,
	providerCount,
}: ModelSearchBarProps) {
	return (
		<div className="p-6 border-b border-neutral">
			<div className="mb-3">
				<h2 className="text-xl font-semibold text-text-primary">
					Select AI Models
				</h2>
				<p className="text-sm text-text-secondary mt-1">
					{totalModels} models available across {providerCount} providers
				</p>
			</div>
			<div className="relative">
				<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
				<input
					type="text"
					placeholder="Search models or providers..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full pl-10 pr-4 py-3 border border-neutral rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary text-text-primary placeholder-text-muted"
					autoFocus
				/>
			</div>
		</div>
	)
}
