import { TrashIcon } from '@heroicons/react/24/outline'
import type { Model } from '../lib/models'

// Import logos
import googleLogo from '../assets/logos/google.svg'
import openaiLogo from '../assets/logos/openai.svg'
import anthropicLogo from '../assets/logos/anthropic.svg'
import xaiLogo from '../assets/logos/grok.svg'
// import mistralLogo from '../assets/logos/mistral.svg'
// import groqLogo from '../assets/logos/groq.svg'
// import deepseekLogo from '../assets/logos/deepseek.svg'
// import togetherLogo from '../assets/logos/together.svg'
// import perplexityLogo from '../assets/logos/perplexity.svg'

const PROVIDER_LOGOS: Record<string, string> = {
	Google: googleLogo,
	OpenAI: openaiLogo,
	Anthropic: anthropicLogo,
	xAI: xaiLogo,
	// Mistral: mistralLogo,
	// Groq: groqLogo,
	// Deepseek: deepseekLogo,
	// TogetherAI: togetherLogo,
	// Perplexity: perplexityLogo,
}

interface ModelItemProps {
	model: Model
	showRemoveButton?: boolean
	onRemove?: () => void
	disableRemove?: boolean
	showStatus?: boolean
	hasValidKey?: boolean
	className?: string
	onClick?: () => void
}

export default function ModelItem({
	model,
	showRemoveButton = false,
	onRemove,
	disableRemove = false,
	showStatus = false,
	hasValidKey = true,
	className = '',
	onClick,
}: ModelItemProps) {
	const status = {
		hasValidKey,
		statusText: hasValidKey ? 'Ready' : 'API Key Required',
		statusColor: hasValidKey
			? 'bg-success-light text-success-dark'
			: 'bg-warning-light text-warning-dark',
	}

	return (
		<div
			className={`bg-surface-input p-4 flex items-center justify-between group relative h-20 ${
				onClick
					? 'cursor-pointer hover:border-secondary hover:bg-secondary-light transition-all'
					: ''
			} ${className}`}
			onClick={onClick}
		>
			{showRemoveButton && onRemove && (
				<button
					onClick={(e) => {
						e.stopPropagation()
						onRemove()
					}}
					disabled={disableRemove}
					className="absolute inset-0 flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-0"
					title={
						disableRemove ? 'Cannot remove the last model' : 'Remove model'
					}
				>
					<TrashIcon className="w-5 h-5" />
					<span className="text-sm font-medium">Remove</span>
				</button>
			)}
			<div className="flex gap-4 items-start justify-between w-full">
				<div className="flex gap-4 items-center min-w-0">
					{PROVIDER_LOGOS[model.provider] && (
						<img
							src={PROVIDER_LOGOS[model.provider]}
							alt={`${model.provider} logo`}
							className="w-8 h-8 object-contain flex-shrink-0"
							onError={(e) => {
								// Hide the image if it fails to load
								;(e.target as HTMLImageElement).style.display = 'none'
							}}
						/>
					)}
					<div className="min-w-0">
						<div className="font-medium text-text-primary truncate max-w-full">
							{model.name}
						</div>
						{showStatus && !status.hasValidKey && (
							<div className="mt-1 transition-opacity">
								<span
									className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${status.statusColor}`}
								>
									{status.statusText}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
