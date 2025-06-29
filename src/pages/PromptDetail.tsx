import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSystemPromptStore } from '../lib/stores'
import { useEffect, useState } from 'react'
import TableLayout from '../components/TableLayout'

export default function PromptDetailPage() {
	const params = useParams()
	const navigate = useNavigate()
	const promptId = params.id as string

	const {
		prompts,
		activePromptId,
		activeVersionId,
		setActivePromptId,
		hasHydrated,
	} = useSystemPromptStore()

	const [inputPromptContent, setInputPromptContent] = useState('')
	const [isLoadingPrompt, setIsLoadingPrompt] = useState(true)
	const currentPrompt = prompts.find((p) => p.id === promptId)

	useEffect(() => {
		// Only update active prompt if it's different and we have a valid prompt
		if (
			hasHydrated &&
			promptId &&
			currentPrompt &&
			activePromptId !== promptId
		) {
			setIsLoadingPrompt(true) // Start loading when switching prompts
			setInputPromptContent('') // Clear old content to prevent flash
			setActivePromptId(promptId)
		}
	}, [hasHydrated, promptId, currentPrompt, activePromptId, setActivePromptId])

	// Handle initial loading state
	useEffect(() => {
		// If we've hydrated but don't have a current prompt, we're not loading anymore
		if (hasHydrated && promptId && !currentPrompt) {
			setIsLoadingPrompt(false)
		}
	}, [hasHydrated, promptId, currentPrompt])

	// Sync editor content with active prompt content - only when switching prompts/versions
	useEffect(() => {
		if (activePromptId && activeVersionId && activePromptId === promptId) {
			// Only set content if the active prompt matches the current page
			const prompt = prompts.find((p) => p.id === activePromptId)
			const version = prompt?.versions.find(
				(v) => v.versionId === activeVersionId
			)
			const content = version?.content || ''
			setInputPromptContent(content)
			setIsLoadingPrompt(false) // Content is ready
		} else {
			// Clear content if prompt doesn't match or no active prompt
			if (activePromptId !== promptId) {
				setInputPromptContent('')
			}
			if (hasHydrated && promptId && !currentPrompt) {
				setIsLoadingPrompt(false) // No content to load for non-existent prompt
			}
		}
	}, [activePromptId, activeVersionId, hasHydrated, promptId, currentPrompt]) // eslint-disable-line react-hooks/exhaustive-deps

	// If prompt doesn't exist after hydration, redirect to home
	useEffect(() => {
		if (hasHydrated && promptId && !currentPrompt) {
			navigate('/')
		}
	}, [hasHydrated, promptId, currentPrompt, navigate])

	// Show loading state only while store is hydrating
	if (!hasHydrated) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-surface-background">
				<div className="text-center">
					<div className="animate-spin h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
					<p className="text-text-muted">Loading prompt...</p>
				</div>
			</div>
		)
	}

	// Show loading while prompt content is being prepared or if content doesn't match current prompt
	const shouldShowLoading =
		hasHydrated &&
		(isLoadingPrompt ||
			!activePromptId ||
			activePromptId !== promptId ||
			!activeVersionId)

	if (shouldShowLoading && currentPrompt) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-surface-background">
				<div className="text-center">
					<div className="animate-spin h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
					<p className="text-text-muted">Loading prompt content...</p>
				</div>
			</div>
		)
	}

	// Show "not found" only if we've hydrated and the prompt definitely doesn't exist
	if (hasHydrated && promptId && !currentPrompt) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-surface-background">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-text-primary mb-4">
						Prompt Not Found
					</h1>
					<p className="text-text-secondary mb-4">
						The prompt you're looking for doesn't exist.
					</p>
					<Link
						to="/"
						className="text-primary-600 hover:text-primary-700 underline"
					>
						← Back to Home
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-surface-background">
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
