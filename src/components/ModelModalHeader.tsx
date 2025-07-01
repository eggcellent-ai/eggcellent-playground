import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModelModalHeaderProps {
	onClose: () => void
}

export default function ModelModalHeader({ onClose }: ModelModalHeaderProps) {
	return (
		<div className="flex items-center justify-between p-6 border-b border-neutral">
			<div>
				<h2 className="text-xl font-semibold text-text-primary">
					Model Selection
				</h2>
				<p className="text-sm text-text-secondary mt-1">
					Choose AI models for your prompts
				</p>
			</div>
			<button
				onClick={onClose}
				className="p-2 hover:bg-neutral-hover rounded-full transition-colors"
			>
				<XMarkIcon className="w-5 h-5 text-text-secondary" />
			</button>
		</div>
	)
}
