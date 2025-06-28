import { useState, useEffect } from 'react'
import { useApiKeyStore, apiKeyStorage } from '../lib/stores'
import {
	XMarkIcon,
	EyeIcon,
	EyeSlashIcon,
	KeyIcon,
} from '@heroicons/react/24/outline'
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'

interface ApiKeySettingsProps {
	isOpen: boolean
	onClose: () => void
}

export default function ApiKeySettings({
	isOpen,
	onClose,
}: ApiKeySettingsProps) {
	const { openaiKey, anthropicKey, setOpenaiKey, setAnthropicKey, clearKeys } =
		useApiKeyStore()

	const [tempOpenaiKey, setTempOpenaiKey] = useState('')
	const [tempAnthropicKey, setTempAnthropicKey] = useState('')
	const [showOpenaiKey, setShowOpenaiKey] = useState(false)
	const [showAnthropicKey, setShowAnthropicKey] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)

	// Load keys from localStorage on mount
	useEffect(() => {
		if (isOpen) {
			const storedOpenaiKey = apiKeyStorage.getOpenAIKey()
			const storedAnthropicKey = apiKeyStorage.getAnthropicKey()

			setTempOpenaiKey(storedOpenaiKey)
			setTempAnthropicKey(storedAnthropicKey)

			// Update the store with loaded keys
			setOpenaiKey(storedOpenaiKey)
			setAnthropicKey(storedAnthropicKey)
		}
	}, [isOpen, setOpenaiKey, setAnthropicKey])

	const handleSave = () => {
		setOpenaiKey(tempOpenaiKey)
		setAnthropicKey(tempAnthropicKey)

		setSaveSuccess(true)
		setTimeout(() => {
			setSaveSuccess(false)
			onClose()
		}, 1000)
	}

	const handleClear = () => {
		clearKeys()
		setTempOpenaiKey('')
		setTempAnthropicKey('')
		setSaveSuccess(false)
	}

	const hasChanges =
		tempOpenaiKey !== openaiKey || tempAnthropicKey !== anthropicKey
	const hasAnyKeys = tempOpenaiKey.trim() || tempAnthropicKey.trim()

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black bg-opacity-50"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-white shadow-xl w-full max-w-md mx-4 p-6">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-4">
						<KeyIcon className="w-6 h-6 text-blue-600" />
						<h2 className="text-xl font-semibold text-gray-900">
							API Key Settings
						</h2>
					</div>
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
					>
						<XMarkIcon className="w-5 h-5" />
					</button>
				</div>

				{/* Warning Message */}
				<div className="mb-8 p-4 bg-amber-50 border border-amber-200">
					<div className="flex gap-3">
						<ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
						<div className="text-sm text-amber-800 leading-relaxed">
							<strong>Security Notice:</strong> API keys are stored locally in
							your browser. They are not sent to our servers except when making
							API calls to OpenAI/Anthropic.
						</div>
					</div>
				</div>

				{/* Form */}
				<div className="space-y-10">
					{/* OpenAI API Key */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							OpenAI API Key
							<span className="text-gray-500 font-normal ml-2">
								(for GPT models)
							</span>
						</label>
						<div className="relative">
							<input
								type={showOpenaiKey ? 'text' : 'password'}
								value={tempOpenaiKey}
								onChange={(e) => setTempOpenaiKey(e.target.value)}
								placeholder="sk-..."
								className="w-full px-4 py-3 pr-12 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
							/>
							<button
								type="button"
								onClick={() => setShowOpenaiKey(!showOpenaiKey)}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
							>
								{showOpenaiKey ? (
									<EyeSlashIcon className="w-4 h-4" />
								) : (
									<EyeIcon className="w-4 h-4" />
								)}
							</button>
						</div>
						<p className="mt-2 text-xs text-gray-500 leading-relaxed">
							Get your API key from{' '}
							<a
								href="https://platform.openai.com/api-keys"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-800 underline"
							>
								OpenAI Platform
							</a>
						</p>
					</div>

					{/* Anthropic API Key */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Anthropic API Key
							<span className="text-gray-500 font-normal ml-2">
								(for Claude models)
							</span>
						</label>
						<div className="relative">
							<input
								type={showAnthropicKey ? 'text' : 'password'}
								value={tempAnthropicKey}
								onChange={(e) => setTempAnthropicKey(e.target.value)}
								placeholder="sk-ant-..."
								className="w-full px-4 py-3 pr-12 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
							/>
							<button
								type="button"
								onClick={() => setShowAnthropicKey(!showAnthropicKey)}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
							>
								{showAnthropicKey ? (
									<EyeSlashIcon className="w-4 h-4" />
								) : (
									<EyeIcon className="w-4 h-4" />
								)}
							</button>
						</div>
						<p className="mt-2 text-xs text-gray-500 leading-relaxed">
							Get your API key from{' '}
							<a
								href="https://console.anthropic.com/settings/keys"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-800 underline"
							>
								Anthropic Console
							</a>
						</p>
					</div>
				</div>

				{/* Actions */}
				<div className="flex justify-between items-center mt-10 pt-6">
					<button
						onClick={handleClear}
						disabled={!hasAnyKeys}
						className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-red-50"
					>
						Clear All Keys
					</button>

					<button
						onClick={handleSave}
						disabled={!hasChanges}
						className={`px-5 py-2 text-sm transition-colors flex items-center gap-2 ${
							saveSuccess
								? 'bg-green-600 text-white'
								: hasChanges
								? 'bg-blue-600 text-white hover:bg-blue-700'
								: 'bg-gray-300 text-gray-500 cursor-not-allowed'
						}`}
					>
						{saveSuccess ? (
							<>
								<CheckIcon className="w-4 h-4" />
								Saved!
							</>
						) : (
							'Save Keys'
						)}
					</button>
				</div>
			</div>
		</div>
	)
}
