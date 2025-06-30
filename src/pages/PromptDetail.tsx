import { useParams, Link } from 'react-router-dom'
import { useSystemPromptStore } from '../lib/stores'
import TableLayout from '../components/TableLayout'
import { useEffect, useState } from 'react'

export default function PromptDetailPage() {
	const { id: promptId } = useParams<{ id: string }>()
	const prompts = useSystemPromptStore((state) => state.prompts)
	const setActivePromptId = useSystemPromptStore(
		(state) => state.setActivePromptId
	)
	const setActiveVersionId = useSystemPromptStore(
		(state) => state.setActiveVersionId
	)

	const [hasHydrated, setHasHydrated] = useState(false)
	const [shouldShowLoading, setShouldShowLoading] = useState(true)

	// Find the current prompt
	const currentPrompt = prompts.find((prompt) => prompt.id === promptId)

	// Track hydration state
	useEffect(() => {
		// Wait a bit before allowing navigation to ensure store is hydrated
		const timer = setTimeout(() => {
			setHasHydrated(true)
		}, 100)

		return () => clearTimeout(timer)
	}, [])

	// Set active prompt when component mounts or promptId changes
	useEffect(() => {
		if (promptId && hasHydrated) {
			setActivePromptId(promptId)

			// If prompt exists and has versions, set the latest version as active
			if (currentPrompt && currentPrompt.versions.length > 0) {
				// Sort by timestamp to get the latest version
				const sortedVersions = [...currentPrompt.versions].sort(
					(a, b) => b.timestamp - a.timestamp
				)
				const latestVersion = sortedVersions[0]
				if (latestVersion) {
					setActiveVersionId(latestVersion.versionId)
				}
			}
		}
	}, [
		promptId,
		hasHydrated,
		currentPrompt,
		setActivePromptId,
		setActiveVersionId,
	])

	// Set up loading state timing
	useEffect(() => {
		// Show loading for a brief moment even if data is available for better UX
		const timer = setTimeout(() => {
			setShouldShowLoading(false)
		}, 300)

		return () => clearTimeout(timer)
	}, [currentPrompt])

	// Get the content for the input prompt (latest version content)
	const inputPromptContent = currentPrompt?.versions.length
		? (() => {
				// Sort by timestamp to get the latest version
				const sortedVersions = [...currentPrompt.versions].sort(
					(a, b) => b.timestamp - a.timestamp
				)
				return sortedVersions[0]?.content || ''
		  })()
		: ''

	// Show loading state while hydrating or briefly after data loads
	if (!hasHydrated) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-background">
				<div className="text-center">
					<div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted">Loading prompt...</p>
				</div>
			</div>
		)
	}

	if (shouldShowLoading && currentPrompt) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-background">
				<div className="text-center">
					<div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted">Loading prompt content...</p>
				</div>
			</div>
		)
	}

	// Show "not found" only if we've hydrated and the prompt definitely doesn't exist
	if (hasHydrated && promptId && !currentPrompt) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-background">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-text-primary mb-4">
						Prompt Not Found
					</h1>
					<p className="text-text-secondary mb-4">
						The prompt you're looking for doesn't exist.
					</p>
					<Link
						to="/"
						className="text-primary hover:text-primary-dark underline"
					>
						← Back to Home
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-full mx-auto h-full">
				{/* Content - Vertical Split Layout */}
				<div className="flex flex-col h-screen">
					{/* Table Layout */}
					<div className="flex-1 flex flex-col p-4">
						<TableLayout inputPromptContent={inputPromptContent} />
					</div>
				</div>
			</div>
		</div>
	)
}
