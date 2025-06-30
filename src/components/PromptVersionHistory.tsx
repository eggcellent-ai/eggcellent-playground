import { useEffect } from 'react'
import { useSystemPromptStore } from '../lib/stores'
import { TrashIcon } from '@heroicons/react/24/outline'

interface PromptVersionHistoryProps {
	activePromptId: string | null
}

const PromptVersionHistory: React.FC<PromptVersionHistoryProps> = ({
	activePromptId,
}) => {
	const prompts = useSystemPromptStore((state) => state.prompts)
	const revertPromptVersion = useSystemPromptStore(
		(state) => state.revertPromptVersion
	)
	const deleteVersion = useSystemPromptStore((state) => state.deleteVersion)
	const activeVersionId = useSystemPromptStore((state) => state.activeVersionId)
	const setActiveVersionId = useSystemPromptStore(
		(state) => state.setActiveVersionId
	)

	const activePrompt = prompts.find((prompt) => prompt.id === activePromptId)

	// Auto-select latest version when no active version matches current prompt
	useEffect(() => {
		if (!activePrompt || activePrompt.versions.length === 0) {
			return
		}

		// Check if current activeVersionId exists in this prompt's versions
		const hasValidActiveVersion = activePrompt.versions.some(
			(version) => version.versionId === activeVersionId
		)

		// If no valid active version for this prompt, select the latest one
		if (!hasValidActiveVersion) {
			// Sort by timestamp to get the latest version
			const sortedVersions = [...activePrompt.versions].sort(
				(a, b) => b.timestamp - a.timestamp
			)
			const latestVersion = sortedVersions[0]

			if (latestVersion) {
				setActiveVersionId(latestVersion.versionId)
				revertPromptVersion(activePrompt.id, latestVersion.versionId)
			}
		}
	}, [activePrompt, activeVersionId, setActiveVersionId, revertPromptVersion])

	if (!activePrompt || activePrompt.versions.length === 0) {
		return <p className="text-text-muted">No versions available.</p>
	}

	// Sort versions by timestamp in descending order (latest first)
	const sortedVersions = [...activePrompt.versions].sort(
		(a, b) => b.timestamp - a.timestamp
	)

	const handleDelete = (versionId: string, e: React.MouseEvent) => {
		e.stopPropagation() // Prevent triggering the version selection
		if (activePrompt.versions.length <= 1) {
			alert('Cannot delete the last version')
			return
		}
		deleteVersion(activePrompt.id, versionId)
	}

	return (
		<div className="space-y-3">
			{sortedVersions.map((version) => (
				<div
					key={version.versionId}
					onClick={() => {
						setActiveVersionId(version.versionId)
						revertPromptVersion(activePrompt.id, version.versionId)
					}}
					className={`p-3 border cursor-pointer transition-all duration-200 group ${
						activeVersionId === version.versionId
							? 'bg-success-light border-success'
							: 'border-neutral hover:border-secondary'
					}`}
				>
					<div className="relative flex items-start">
						<button
							onClick={(e) => {
								e.stopPropagation()
								handleDelete(version.versionId, e)
							}}
							className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error-100"
							aria-label="Delete version"
						>
							<TrashIcon
								className="h-4 w-4 text-error-500"
								aria-hidden="true"
							/>
						</button>

						<div className="pr-8">
							<p className="text-xs font-medium text-text-secondary mb-2">
								{(() => {
									const date = new Date(version.timestamp)
									const time = date.toLocaleTimeString('en-US', {
										hour: 'numeric',
										minute: '2-digit',
										hour12: true,
									})
									const day = date.toLocaleDateString('en-US', {
										weekday: 'short',
									})
									const dayOfMonth = date.getDate()
									return `${time}, ${day} ${dayOfMonth}`
								})()}
							</p>

							<div className="text-sm text-text-primary">
								{version.content ? (
									<div className="space-y-1">
										{version.content
											.split('\n')
											.slice(0, 3)
											.map((line, index) => (
												<div key={index} className="truncate" title={line}>
													{line || '\u00A0'}
												</div>
											))}
										{version.content.split('\n').length > 3 && (
											<div className="text-text-muted italic text-xs">...</div>
										)}
									</div>
								) : (
									<div className="text-text-muted italic text-xs">
										Empty prompt
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	)
}

export default PromptVersionHistory
