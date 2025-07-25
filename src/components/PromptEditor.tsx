import { useState } from 'react'
import { useSystemPromptStore } from '../lib/stores'
import {
	ArrowsPointingOutIcon,
	ArrowsPointingInIcon,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import PromptVersionHistory from './PromptVersionHistory'

interface PromptEditorProps {
	activePromptId: string
	promptContent: string
	onPromptContentChange: (content: string) => void
	hasUnsavedChanges: boolean
	onUnsavedChangesChange: (hasChanges: boolean) => void
}

export default function PromptEditor({
	activePromptId,
	promptContent,
	onPromptContentChange,
	hasUnsavedChanges,
	onUnsavedChangesChange,
}: PromptEditorProps) {
	const { updatePrompt, prompts } = useSystemPromptStore()

	const [showVersionHistory, setShowVersionHistory] = useState(false)
	const [editorHeight, setEditorHeight] = useState(200) // Default height in pixels
	const [isEditorExpanded, setIsEditorExpanded] = useState(false)
	const [updateSuccess, setUpdateSuccess] = useState(false)

	// Get current prompt
	const currentPrompt = prompts.find((p) => p.id === activePromptId)

	const handleSavePrompt = () => {
		if (activePromptId && promptContent.trim()) {
			updatePrompt(activePromptId, promptContent)
			setUpdateSuccess(true)
			onUnsavedChangesChange(false)
			setTimeout(() => setUpdateSuccess(false), 1000)
		}
	}

	const handlePromptChange = (content: string) => {
		onPromptContentChange(content)
		onUnsavedChangesChange(true)
	}

	return (
		<div>
			{/* Section Header */}
			<div className="px-2 pb-2 pt-8">
				<div className="flex justify-between items-center">
					<h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
						System Prompt
					</h2>
					{hasUnsavedChanges && (
						<span className="text-xs text-warning-dark bg-warning-light px-2 py-1 rounded">
							Unsaved changes
						</span>
					)}
				</div>
			</div>
			<div className="border border-neutral">
				{/* Prompt Editor */}
				<div className="bg-surface-card">
					<div className="p-4 relative">
						{/* Expand/Collapse Icon - Top Right */}
						<button
							onClick={() => setIsEditorExpanded(!isEditorExpanded)}
							className="absolute top-2 right-2 p-1 text-secondary hover:text-primary hover:bg-neutral-hover transition-colors z-1"
							title={isEditorExpanded ? 'Collapse editor' : 'Expand editor'}
						>
							{isEditorExpanded ? (
								<ArrowsPointingInIcon className="w-4 h-4" />
							) : (
								<ArrowsPointingOutIcon className="w-4 h-4" />
							)}
						</button>
						<textarea
							className="w-full resize-y bg-surface-card text-primary placeholder-text-muted transition-colors text-sm focus:outline-none"
							style={{
								height: isEditorExpanded
									? 'calc(100vh - 200px)'
									: `${editorHeight}px`,
								minHeight: isEditorExpanded
									? 'calc(100vh - 200px)'
									: `${editorHeight}px`,
							}}
							value={promptContent}
							id="system-prompt"
							name="system-prompt"
							placeholder="Enter system prompt..."
							onChange={(e) => handlePromptChange(e.target.value)}
							onInput={(e) => {
								if (!isEditorExpanded) {
									const target = e.target as HTMLTextAreaElement
									setEditorHeight(target.offsetHeight)
								}
							}}
						/>

						<div className="flex justify-end items-center gap-2 mt-3">
							<button
								onClick={() => setShowVersionHistory(!showVersionHistory)}
								className={`px-4 py-2 text-sm border transition-colors ${
									showVersionHistory
										? 'bg-neutral border-neutral text-primary'
										: 'border-neutral text-secondary hover:border-neutral-dark hover:bg-neutral-hover'
								}`}
							>
								{showVersionHistory
									? 'Hide Version'
									: `Show Version (${currentPrompt?.versions.length || 0})`}
							</button>
							<button
								onClick={handleSavePrompt}
								className={`px-4 py-2 text-sm border ${
									updateSuccess
										? 'bg-success border-success text-white'
										: hasUnsavedChanges
										? 'bg-warning border-warning text-white hover:bg-warning-dark'
										: 'bg-neutral-dark border-neutral-dark text-white hover:bg-primary'
								} transition-colors flex items-center gap-1`}
							>
								{updateSuccess ? (
									<>
										<CheckIcon className="w-3 h-3" />
										Updated
									</>
								) : hasUnsavedChanges ? (
									'Save Changes'
								) : (
									'Update Prompt'
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
			{/* Version History */}
			{showVersionHistory && (
				<div className="border-t border-neutral p-4">
					<h3 className="text-sm font-semibold mb-3 text-primary">
						Version History
					</h3>
					<PromptVersionHistory activePromptId={activePromptId} />
				</div>
			)}
		</div>
	)
}
