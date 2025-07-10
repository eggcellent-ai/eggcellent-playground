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
									className="text-secondary px-4 py-2 font-semibold transition-colors cursor-pointer hover:opacity-50 pl-10"
								>
									All Prompts
								</Link>
							)}
							<a
								href="https://github.com/eggcellent-ai/eggcellent-playground"
								target="_blank"
								rel="noopener noreferrer"
								className="text-secondary px-4 py-2 font-semibold transition-colors hover:text-warning flex items-center gap-2 cursor-pointer hover:opacity-50"
							>
								<svg
									viewBox="0 0 24 24"
									className="w-5 h-5"
									fill="currentColor"
								>
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
								</svg>
								<span className="hidden sm:inline">GitHub</span>
								<span className="sm:hidden">Code</span>
							</a>
							<button
								onClick={handleCreateNewPrompt}
								className="text-secondary px-4 py-2 font-semibold transition-colors cursor-pointer hover:opacity-50 flex items-center gap-2"
							>
								{/* <PlusIcon className="w-5 h-5" /> */}
								<span className="hidden sm:inline">New Prompt</span>
								<span className="sm:hidden">New</span>
							</button>
						</div>

						{/* Action Buttons */}
						<div className="pr-6 flex items-center gap-4">
							<button
								onClick={() => setShowApiKeySettings(true)}
								className="cursor-pointer hover:opacity-50 text-primary px-4 py-2 font-medium transition-colors flex items-center gap-2 border border-neutral bg-neutral-light"
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
