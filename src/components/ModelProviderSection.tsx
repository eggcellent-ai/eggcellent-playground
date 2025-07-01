import { AVAILABLE_MODELS } from '../lib/stores'

interface ModelProviderSectionProps {
	provider: string
	models: Array<(typeof AVAILABLE_MODELS)[number]>
	onAddModel: (modelId: string) => void
	providerIcon: string
	providerDescription: string
}

export default function ModelProviderSection({
	provider,
	models,
	onAddModel,
	providerIcon,
	providerDescription,
}: ModelProviderSectionProps) {
	if (!models || models.length === 0) return null

	return (
		<div className="space-y-3">
			{/* Provider Header */}
			<div className="flex items-center gap-3 pb-2 border-b border-neutral-light">
				<span className="text-2xl">{providerIcon}</span>
				<div>
					<h3 className="font-semibold text-text-primary capitalize">
						{provider}
					</h3>
					<p className="text-xs text-text-secondary">{providerDescription}</p>
				</div>
				<div className="ml-auto">
					<span className="text-xs font-medium text-text-secondary bg-neutral-light px-2 py-1 rounded">
						{models.length} model{models.length !== 1 ? 's' : ''}
					</span>
				</div>
			</div>

			{/* Models Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{models.map((model) => (
					<button
						key={model.id}
						onClick={() => onAddModel(model.id)}
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
									<span className="text-sm">{providerIcon}</span>
								</div>
							</div>
						</div>

						{/* Model metadata */}
						<div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
							<span className="bg-neutral-light px-2 py-1 rounded">
								{provider}
							</span>
						</div>
					</button>
				))}
			</div>
		</div>
	)
}
