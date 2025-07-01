interface ModelModalFooterProps {
	selectedCount: number
	onClose: () => void
}

export default function ModelModalFooter({
	selectedCount,
	onClose,
}: ModelModalFooterProps) {
	return (
		<div className="flex items-center justify-between p-6 border-t border-neutral bg-neutral-50">
			<div className="text-sm text-text-secondary">
				{selectedCount} model{selectedCount !== 1 ? 's' : ''} currently selected
			</div>
			<button
				onClick={onClose}
				className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors"
			>
				Done
			</button>
		</div>
	)
}
