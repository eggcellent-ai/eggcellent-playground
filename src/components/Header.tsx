import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { KeyIcon, PlusIcon } from '@heroicons/react/24/outline'
import ApiKeySettings from './ApiKeySettings'
import { useSystemPromptStore } from '../lib/stores'

export default function Header() {
	const location = useLocation()
	const navigate = useNavigate()
	const isHomePage = location.pathname === '/'
	const [showApiKeySettings, setShowApiKeySettings] = useState(false)
	const { addPrompt, updatePromptTitle } = useSystemPromptStore()

	const handleCreateNewPrompt = () => {
		const state = useSystemPromptStore.getState()
		const promptCount = state.prompts.length + 1
		const autoTitle = `Untitled Prompt ${promptCount}`

		// Add the prompt first
		addPrompt('You are a helpful assistant.')

		// Update the title of the newly created prompt
		setTimeout(() => {
			const state = useSystemPromptStore.getState()
			if (state.activePromptId && state.activeVersionId) {
				updatePromptTitle(
					state.activePromptId,
					state.activeVersionId,
					autoTitle
				)
				// Navigate to the new prompt detail page
				navigate(`/prompt/${state.activePromptId}`)
			}
		}, 0)
	}

	return (
		<>
			<header className="w-full pl-6 pt-6">
				<div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<Link
								to="/"
								className="inline-flex items-center hover:opacity-80 transition-opacity cursor-pointer"
							>
								<img
									src="/image.png"
									alt="Eggcellent AI Logo"
									className="mr-3"
									style={{
										width: 'auto',
										height: 'auto',
										maxWidth: '250px',
										maxHeight: '250px',
									}}
								/>
							</Link>
							{!isHomePage && (
								<Link
									to="/"
									className="text-text-secondary px-4 py-2 font-semibold transition-colors hover:text-warning pl-10"
								>
									All Prompts
								</Link>
							)}
						</div>

						{/* Action Buttons */}
						<div className="pr-6 flex items-center gap-4">
							<button
								onClick={handleCreateNewPrompt}
								className="bg-[#f3f3f3] hover:bg-primary text-primary px-4 py-2 font-medium transition-colors flex items-center gap-2 border border-[#dfdfdf]"
							>
								<PlusIcon className="w-5 h-5" />
								<span className="hidden sm:inline">New Prompt</span>
								<span className="sm:hidden">New</span>
							</button>
							<button
								onClick={() => setShowApiKeySettings(true)}
								className="bg-amber-50 hover:bg-primary text-amber-700 px-4 py-2 font-medium transition-colors flex items-center gap-2 border border-amber-300"
								title="Configure API Keys"
							>
								<KeyIcon className="w-5 h-5" />
								<span className="hidden sm:inline">Setup API Keys</span>
								<span className="sm:hidden">Keys</span>
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* API Key Settings Modal */}
			<ApiKeySettings
				isOpen={showApiKeySettings}
				onClose={() => setShowApiKeySettings(false)}
			/>
		</>
	)
}
