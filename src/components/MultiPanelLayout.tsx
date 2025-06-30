import { useSystemPromptStore } from '../lib/stores'
import { BeakerIcon } from '@heroicons/react/24/outline'
import PromptList from './PromptList'

export default function MultiPanelLayout() {
	const { activePromptId } = useSystemPromptStore()

	const handleTogglePlayground = () => {
		// TODO: Implement playground toggle
		console.log('Toggle playground')
	}

	return (
		<div className="flex h-screen bg-background">
			{/* Left Panel - Prompts List */}
			<div
				className="flex-shrink-0 w-96 border-r border-neutral last:border-r-0"
				style={{ maxWidth: '400px' }}
			>
				<PromptList />
			</div>

			{/* Right Panel - based on selected prompt */}
			{activePromptId ? (
				<div className="flex-shrink-0 w-96 border-l border-neutral bg-surface-card flex items-center justify-center">
					<button
						onClick={handleTogglePlayground}
						className="p-3 text-text-secondary hover:text-primary hover:bg-primary-light transition-colors"
						title="Toggle Playground"
					>
						<BeakerIcon className="w-6 h-6" />
					</button>
				</div>
			) : (
				<div className="flex-1 flex items-center justify-center bg-neutral-hover">
					<div className="text-center text-text-muted">
						<h2 className="text-lg font-semibold mb-2">No Prompt Selected</h2>
						<p>Select a prompt from the list to view and edit it</p>
					</div>
				</div>
			)}
		</div>
	)
}
