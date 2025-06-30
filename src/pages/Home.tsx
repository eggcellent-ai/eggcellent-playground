import PromptList from '../components/PromptList'
import { useSystemPromptStore } from '../lib/stores'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Home() {
	const { prompts, addPrompt, updatePromptTitle } = useSystemPromptStore()
	const navigate = useNavigate()

	useEffect(() => {
		// Auto-create prompt and redirect on first visit (when no prompts exist)
		if (prompts.length === 0) {
			// Create new prompt with default content
			addPrompt('You are a helpful assistant.')

			// Get the newly created prompt ID and navigate to it
			// Use a small timeout to ensure the store state is updated
			setTimeout(() => {
				const state = useSystemPromptStore.getState()
				if (state.activePromptId && state.activeVersionId) {
					// Set a default title for the auto-created prompt
					updatePromptTitle(
						state.activePromptId,
						state.activeVersionId,
						'Welcome Prompt'
					)
					// Navigate to the prompt detail page
					navigate(`/prompt/${state.activePromptId}`)
				}
			}, 0)
		}
	}, [prompts.length, addPrompt, updatePromptTitle, navigate])

	return (
		<div className="min-h-screen">
			<PromptList />
		</div>
	)
}
