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

// Provider configuration
const PROVIDERS = [
	{
		key: 'openai',
		name: 'OpenAI',
		description: 'GPT models (GPT-4o, GPT-4o Mini, o1, etc.)',
		placeholder: 'sk-...',
		getUrl: 'https://platform.openai.com/api-keys',
		getKey: () => apiKeyStorage.getOpenAIKey(),
		setKey: (key: string) => apiKeyStorage.setOpenAIKey(key),
		storeKey: 'openaiKey',
		setStoreKey: 'setOpenaiKey',
	},
	{
		key: 'anthropic',
		name: 'Anthropic',
		description: 'Claude models (Claude 3.5 Sonnet, Haiku, etc.)',
		placeholder: 'sk-ant-...',
		getUrl: 'https://console.anthropic.com/settings/keys',
		getKey: () => apiKeyStorage.getAnthropicKey(),
		setKey: (key: string) => apiKeyStorage.setAnthropicKey(key),
		storeKey: 'anthropicKey',
		setStoreKey: 'setAnthropicKey',
	},
	{
		key: 'xai',
		name: 'xAI',
		description:
			'Grok models (Grok 3, Grok 3 Fast, Grok 3 Mini, Grok 2.1, Grok Beta)',
		placeholder: 'xai-...',
		getUrl: 'https://console.x.ai/team/api-keys',
		getKey: () => apiKeyStorage.getXaiKey(),
		setKey: (key: string) => apiKeyStorage.setXaiKey(key),
		storeKey: 'xaiKey',
		setStoreKey: 'setXaiKey',
	},
	{
		key: 'google',
		name: 'Google',
		description: 'Gemini models (Gemini 1.5 Pro, Flash, etc.)',
		placeholder: 'AI...',
		getUrl: 'https://console.cloud.google.com/apis/credentials',
		getKey: () => apiKeyStorage.getGoogleKey(),
		setKey: (key: string) => apiKeyStorage.setGoogleKey(key),
		storeKey: 'googleKey',
		setStoreKey: 'setGoogleKey',
	},
	{
		key: 'mistral',
		name: 'Mistral',
		description: 'Mistral models (Mistral Large, Medium, Mixtral, etc.)',
		placeholder: '...',
		getUrl: 'https://console.mistral.ai/api-keys',
		getKey: () => apiKeyStorage.getMistralKey(),
		setKey: (key: string) => apiKeyStorage.setMistralKey(key),
		storeKey: 'mistralKey',
		setStoreKey: 'setMistralKey',
	},
	{
		key: 'groq',
		name: 'Groq',
		description: 'Fast inference models (Llama, Mixtral, Gemma)',
		placeholder: 'gsk_...',
		getUrl: 'https://console.groq.com/keys',
		getKey: () => apiKeyStorage.getGroqKey(),
		setKey: (key: string) => apiKeyStorage.setGroqKey(key),
		storeKey: 'groqKey',
		setStoreKey: 'setGroqKey',
	},
	{
		key: 'deepseek',
		name: 'DeepSeek',
		description: 'DeepSeek Chat and Coder models',
		placeholder: 'sk-...',
		getUrl: 'https://platform.deepseek.com/api_keys',
		getKey: () => apiKeyStorage.getDeepseekKey(),
		setKey: (key: string) => apiKeyStorage.setDeepseekKey(key),
		storeKey: 'deepseekKey',
		setStoreKey: 'setDeepseekKey',
	},
	{
		key: 'togetherai',
		name: 'Together.ai',
		description: 'Open source models (Llama, Mistral, RedPajama)',
		placeholder: '...',
		getUrl: 'https://api.together.xyz/settings/api-keys',
		getKey: () => apiKeyStorage.getTogetheraiKey(),
		setKey: (key: string) => apiKeyStorage.setTogetheraiKey(key),
		storeKey: 'togetheraiKey',
		setStoreKey: 'setTogetheraiKey',
	},
	{
		key: 'perplexity',
		name: 'Perplexity',
		description: 'Perplexity Sonar models with web search',
		placeholder: 'pplx-...',
		getUrl: 'https://www.perplexity.ai/settings/api',
		getKey: () => apiKeyStorage.getPerplexityKey(),
		setKey: (key: string) => apiKeyStorage.setPerplexityKey(key),
		storeKey: 'perplexityKey',
		setStoreKey: 'setPerplexityKey',
	},
] as const

export default function ApiKeySettings({
	isOpen,
	onClose,
}: ApiKeySettingsProps) {
	const store = useApiKeyStore()

	const [tempKeys, setTempKeys] = useState<Record<string, string>>({})
	const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
	const [saveSuccess, setSaveSuccess] = useState(false)

	// Load keys from localStorage when modal opens
	useEffect(() => {
		if (isOpen) {
			const keys: Record<string, string> = {}
			PROVIDERS.forEach((provider) => {
				keys[provider.key] = provider.getKey()
			})
			setTempKeys(keys)
		}
	}, [isOpen])

	const handleKeyChange = (providerKey: string, value: string) => {
		setTempKeys((prev) => ({
			...prev,
			[providerKey]: value,
		}))
	}

	const toggleShowKey = (providerKey: string) => {
		setShowKeys((prev) => ({
			...prev,
			[providerKey]: !prev[providerKey],
		}))
	}

	const handleSave = () => {
		PROVIDERS.forEach((provider) => {
			const key = tempKeys[provider.key] || ''
			provider.setKey(key)
			// Safely call the setter method
			switch (provider.setStoreKey) {
				case 'setOpenaiKey':
					store.setOpenaiKey(key)
					break
				case 'setAnthropicKey':
					store.setAnthropicKey(key)
					break
				case 'setXaiKey':
					store.setXaiKey(key)
					break
				case 'setGoogleKey':
					store.setGoogleKey(key)
					break
				case 'setMistralKey':
					store.setMistralKey(key)
					break
				case 'setGroqKey':
					store.setGroqKey(key)
					break
				case 'setDeepseekKey':
					store.setDeepseekKey(key)
					break
				case 'setTogetheraiKey':
					store.setTogetheraiKey(key)
					break
				case 'setPerplexityKey':
					store.setPerplexityKey(key)
					break
			}
		})

		setSaveSuccess(true)
		setTimeout(() => {
			setSaveSuccess(false)
			onClose()
		}, 1000)
	}

	const handleClear = () => {
		store.clearKeys()
		const clearedKeys: Record<string, string> = {}
		PROVIDERS.forEach((provider) => {
			clearedKeys[provider.key] = ''
		})
		setTempKeys(clearedKeys)
		setSaveSuccess(false)
	}

	const hasChanges = PROVIDERS.some((provider) => {
		let currentKey = ''
		switch (provider.storeKey) {
			case 'openaiKey':
				currentKey = store.openaiKey
				break
			case 'anthropicKey':
				currentKey = store.anthropicKey
				break
			case 'xaiKey':
				currentKey = store.xaiKey
				break
			case 'googleKey':
				currentKey = store.googleKey
				break
			case 'mistralKey':
				currentKey = store.mistralKey
				break
			case 'groqKey':
				currentKey = store.groqKey
				break
			case 'deepseekKey':
				currentKey = store.deepseekKey
				break
			case 'togetheraiKey':
				currentKey = store.togetheraiKey
				break
			case 'perplexityKey':
				currentKey = store.perplexityKey
				break
		}
		const tempKey = tempKeys[provider.key] || ''
		return currentKey !== tempKey
	})

	const hasAnyKeys = PROVIDERS.some((provider) => {
		const tempKey = tempKeys[provider.key] || ''
		return tempKey.trim() !== ''
	})

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black bg-opacity-50"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-white shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
					<div className="flex items-center justify-between">
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
				</div>

				<div className="p-6">
					{/* Warning Message */}
					<div className="mb-6 p-4 bg-warning-light border border-warning">
						<div className="flex gap-3">
							<ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
							<div className="text-sm text-amber-800 leading-relaxed">
								<strong>Security Notice:</strong> API keys are stored locally in
								your browser. They are not sent to our servers except when
								making API calls to the respective providers.
							</div>
						</div>
					</div>

					{/* Provider Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{PROVIDERS.map((provider) => (
							<div
								key={provider.key}
								className={`border border-gray-200 p-4 ${
									tempKeys[provider.key]?.trim() ? 'bg-green-50' : 'bg-white'
								}`}
							>
								<div className="mb-3">
									<div className="flex items-center justify-between mb-1">
										<label className="text-sm font-medium text-gray-700">
											{provider.name}
										</label>
										<span className="text-xs text-gray-500">
											{tempKeys[provider.key]?.trim() ? '✅ Set' : '⚠️ Empty'}
										</span>
									</div>
									<p className="text-xs text-gray-500 mb-3">
										{provider.description}
									</p>
								</div>

								<div className="relative mb-3">
									<input
										type={showKeys[provider.key] ? 'text' : 'password'}
										value={tempKeys[provider.key] || ''}
										onChange={(e) =>
											handleKeyChange(provider.key, e.target.value)
										}
										placeholder={provider.placeholder}
										className="w-full px-3 py-2 pr-10 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									/>
									<button
										type="button"
										onClick={() => toggleShowKey(provider.key)}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
									>
										{showKeys[provider.key] ? (
											<EyeSlashIcon className="w-4 h-4" />
										) : (
											<EyeIcon className="w-4 h-4" />
										)}
									</button>
								</div>

								<a
									href={provider.getUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs text-blue-600 hover:text-blue-800 underline"
								>
									Get API Key →
								</a>
							</div>
						))}
					</div>

					{/* Actions */}
					<div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
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
							className={`px-6 py-2 text-sm transition-colors flex items-center gap-2 ${
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
		</div>
	)
}
