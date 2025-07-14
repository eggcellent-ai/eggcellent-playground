import { useSystemPromptStore } from '../lib/stores'
import { useNavigate } from 'react-router-dom'
import { TrashIcon } from '@heroicons/react/24/outline'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

interface PromptType {
	id: string
	versions: Array<{ content: string; title: string; timestamp: number }>
}

export default function PromptList() {
	const { prompts, deletePrompt, addPrompt, updatePromptTitle } =
		useSystemPromptStore()

	const navigate = useNavigate()

	const handlePromptClick = (promptId: string) => {
		navigate(`/prompt/${promptId}`)
	}

	const handleCreateNewPrompt = () => {
		const promptCount = prompts.length + 1
		const autoTitle = `Untitled Prompt ${promptCount}`

		// Add the prompt first
		addPrompt('You are a helpful assistant.')

		// Update the title of the newly created prompt
		// Since addPrompt sets the new prompt as active, we can use a timeout to ensure state is updated
		setTimeout(() => {
			const state = useSystemPromptStore.getState()
			if (state.activePromptId && state.activeVersionId) {
				updatePromptTitle(
					state.activePromptId,
					state.activeVersionId,
					autoTitle
				)
			}
		}, 0)
	}

	const getPromptPreview = (prompt: PromptType) => {
		if (prompt.versions.length === 0) return 'No content'
		const latestVersion = prompt.versions[prompt.versions.length - 1]
		return latestVersion?.content || 'No content'
	}

	const getPromptTitle = (prompt: PromptType) => {
		if (prompt.versions.length === 0) return 'Untitled Prompt'
		const latestVersion = prompt.versions[prompt.versions.length - 1]
		const title = latestVersion?.title

		// If title exists and is not empty, use it
		if (title && title.trim()) {
			return title.length > 50 ? title.substring(0, 50) + '...' : title
		}

		// Fallback to content preview if no title
		const content = latestVersion?.content || 'Untitled Prompt'
		return content.length > 50 ? content.substring(0, 50) + '...' : content
	}

	return (
		<div className="flex flex-col h-full py-10">
			<div className="flex-1 overflow-y-auto">
				{prompts.length === 0 ? (
					<div className="h-full flex items-center justify-center">
						<div className="text-center py-12">
							<div className="w-24 h-24 mx-auto mb-4 bg-neutral-hover flex items-center justify-center">
								<DocumentTextIcon
									className="w-12 h-12 text-muted"
									aria-hidden="true"
								/>
							</div>
							<div className="space-y-4">
								<div>
									<p className="text-xl text-secondary mb-2">No prompts yet</p>
									<p className="text-muted mb-6">
										Create your first prompt to get started with AI
										conversations
									</p>
								</div>
								<button
									onClick={handleCreateNewPrompt}
									className="bg-neutral-dark hover:bg-primary text-white px-6 py-3 font-medium transition-colors"
								>
									Create First Prompt
								</button>
							</div>
						</div>
					</div>
				) : (
					<div className="p-4 space-y-4">
						{prompts.map((prompt: PromptType) => (
							<div
								key={prompt.id}
								onClick={() => handlePromptClick(prompt.id)}
								className="bg-surface-card border border-neutral hover:bg-neutral-hover transition-all duration-200 cursor-pointer group"
							>
								<div className="p-4">
									<div className="flex items-start justify-between mb-8">
										<div className="flex-1 min-w-0 flex items-start">
											<h3 className="text-lg font-medium text-primary line-clamp-1">
												{getPromptTitle(prompt)}
											</h3>
										</div>
										<div className="flex items-start gap-3">
											<div className="flex items-center gap-2 text-sm text-gray-500">
												<span>
													{prompt.versions.length} version
													{prompt.versions.length !== 1 ? 's' : ''}
												</span>
												<span>•</span>
												<span>
													{prompt.versions.length > 0 &&
														new Date(
															prompt.versions[
																prompt.versions.length - 1
															].timestamp
														).toLocaleDateString()}
												</span>
											</div>
											<button
												onClick={(e) => {
													e.stopPropagation()
													deletePrompt(prompt.id)
												}}
												className="transition-opacity p-1 hover:bg-error-50"
												aria-label="Delete prompt"
											>
												<TrashIcon
													className="w-4 h-4 text-error-500"
													aria-hidden="true"
												/>
											</button>
										</div>
									</div>

									<p className="text-sm text-gray-500 line-clamp-3 mb-3">
										{getPromptPreview(prompt)}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
