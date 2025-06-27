import { useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { KeyIcon } from '@heroicons/react/24/outline'
import ApiKeySettings from './ApiKeySettings'
import { useApiKeyStore } from '../lib/stores'

export default function Header() {
	const location = useLocation()
	const isHomePage = location.pathname === '/'
	const [showApiKeySettings, setShowApiKeySettings] = useState(false)
	const [hasKeys, setHasKeys] = useState(false)
	const [mounted, setMounted] = useState(false)
	const { hasValidKeys } = useApiKeyStore()

	// Prevent hydration mismatch by only showing key status after mount
	useEffect(() => {
		setMounted(true)
		setHasKeys(hasValidKeys())
	}, [hasValidKeys])

	// Update key status when store changes
	useEffect(() => {
		if (mounted) {
			setHasKeys(hasValidKeys())
		}
	}, [hasValidKeys, mounted])

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
									className="text-text-secondary px-4 py-2 rounded-lg font-semibold transition-colors hover:text-amber-500 pl-10"
								>
									All Prompts
								</Link>
							)}
						</div>

						{/* API Key Settings Button */}
						<div className="pr-6">
							<button
								onClick={() => setShowApiKeySettings(true)}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									mounted && hasKeys
										? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
										: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
								}`}
								title="Configure API Keys"
							>
								<KeyIcon className="w-4 h-4" />
								<span className="hidden sm:inline">
									{mounted && hasKeys ? 'API Keys Set' : 'Setup API Keys'}
								</span>
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
