import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline'
import { PlayIcon } from '@heroicons/react/24/solid'
import type { Model } from '../lib/models'
import { useAuthStore } from '../lib/authStore'

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
	selected?: boolean
	showLogo?: boolean // New prop to control logo visibility
	showRunButton?: boolean // New prop to show run button on hover
	onRun?: () => void // New prop for run button click handler
	isLoading?: boolean // New prop to show loading state
	disabled?: boolean // New prop to disable the run button
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
	selected = false,
	showLogo = true, // Default to showing logo
	showRunButton = false, // Default to not showing run button
	onRun,
	isLoading = false,
	disabled = false,
}: ModelItemProps) {
	const { user } = useAuthStore()

	// User can use the model if they're logged in OR have valid API keys
	const canUseModel = Boolean(user || hasValidKey)

	const status = {
		hasValidKey: canUseModel,
		statusText: canUseModel ? 'Ready' : 'API Key Required',
		statusColor: canUseModel
			? 'bg-success-light text-success-dark'
			: 'bg-warning-light text-warning-dark',
	}

	return (
		<div
			className={`bg-surface-input p-4 flex items-center justify-between group relative h-15 ${
				onClick
					? 'cursor-pointer hover:border-secondary hover:bg-neutral-light transition-all'
					: ''
			} ${selected ? 'bg-neutral-light border-secondary' : ''} ${className}`}
			onClick={onClick}
			title={model.id} // Add tooltip showing model ID on hover
		>
			{showRemoveButton && onRemove && (
				<button
					onClick={(e) => {
						e.stopPropagation()
						onRemove()
					}}
					disabled={disableRemove}
					className="absolute inset-0 flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity text-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-0"
					title={
						disableRemove ? 'Cannot remove the last model' : 'Remove model'
					}
				>
					<TrashIcon className="w-5 h-5" />
					<span className="text-sm font-medium">Remove</span>
				</button>
			)}

			{/* Run Button - appears on hover when showRunButton is true */}
			{showRunButton && onRun && (
				<button
					onClick={(e) => {
						e.stopPropagation()
						onRun()
					}}
					disabled={disabled || isLoading}
					className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white shadow-lg p-2 text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed z-10"
					title={
						isLoading
							? 'Running...'
							: disabled
							? 'No content to run'
							: 'Run all inputs for this model'
					}
				>
					<PlayIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
				</button>
			)}

			<div className="flex gap-4 items-center justify-between w-full">
				<div className="flex gap-4 items-center min-w-0">
					{showLogo && PROVIDER_LOGOS[model.provider] && (
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
					<div className="min-w-0 flex items-center gap-2">
						<div className="font-medium text-primary text-sm truncate ">
							{model.name}
						</div>
						{showStatus && !status.hasValidKey && (
							<div className="transition-opacity">
								<span
									className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${status.statusColor}`}
								>
									{status.statusText}
								</span>
							</div>
						)}
					</div>
				</div>
				{selected && (
					<div className="">
						<CheckIcon className="w-5 h-5 text-secondary" />
					</div>
				)}
			</div>
		</div>
	)
}
