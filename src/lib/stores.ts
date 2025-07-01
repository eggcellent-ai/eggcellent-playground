import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Message } from '@ai-sdk/react'

interface ConversationHistory {
	messages: Message[]
	lastUpdated: number
}

// New interfaces for multi-playground support
interface PlaygroundInstance {
	id: string
	selectedModel: string
	messages: Message[]
	isLoading: boolean
	// Add conversation history back to playground instance since it's now version-specific
	conversationHistory: ConversationHistory | null
}

interface PromptVersion {
	versionId: string
	title: string
	content: string
	timestamp: number
	// Move playground instances to prompt version level
	playgroundInstances: PlaygroundInstance[]
	// Store only responses at version level (rowId -> modelId -> response)
	responses: Record<string, Record<string, string>>
}

// New interface for input data at prompt level
interface InputRow {
	id: string
	input: string
	images: UploadedImage[]
	timestamp: number
}

// Combined interface for table display (merges input + responses)
interface TableRow extends InputRow {
	// Store responses for each model (inherited from version)
	responses: Record<string, string>
}

interface UploadedImage {
	id: string
	name: string
	base64: string
	preview: string
}

interface Prompt {
	id: string
	versions: PromptVersion[]
	// Move input data to prompt level - shared across all versions
	inputRows: InputRow[]
	// Add variables to prompt level - shared across all versions
	variables: Record<string, string>
}

interface SystemPromptState {
	activePromptId: string | null
	activeVersionId: string | null
	prompts: Prompt[]
	clearChatMessages: (() => void) | null
	hasHydrated: boolean
	setActivePromptId: (id: string | null) => void
	setActiveVersionId: (id: string | null) => void
	addPrompt: (content: string) => void
	deletePrompt: (id: string) => void
	deleteVersion: (promptId: string, versionId: string) => void
	updatePrompt: (id: string, newContent: string) => void
	updatePromptTitle: (
		promptId: string,
		versionId: string,
		title: string
	) => void
	revertPromptVersion: (promptId: string, versionId: string) => void
	setClearChatMessages: (clearFn: () => void) => void
	// Update variable management methods to work at prompt level
	getPromptVariables: (promptId: string) => Record<string, string>
	updatePromptVariable: (promptId: string, key: string, value: string) => void
	deletePromptVariable: (promptId: string, key: string) => void
	// Function to substitute variables in prompt content
	substituteVariables: (
		promptId: string,
		versionId: string,
		content: string
	) => string
	// Updated conversation history methods to work with playground instances within versions
	saveConversationHistory: (
		promptId: string,
		versionId: string,
		playgroundId: string,
		messages: Message[]
	) => void
	getConversationHistory: (
		promptId: string,
		versionId: string,
		playgroundId: string
	) => Message[] | null
	clearConversationHistory: (
		promptId: string,
		versionId: string,
		playgroundId: string
	) => void
	// Updated playground instance methods to work per version
	addPlaygroundInstance: (promptId: string, versionId: string) => void
	removePlaygroundInstance: (
		promptId: string,
		versionId: string,
		instanceId: string
	) => void
	updatePlaygroundModel: (
		promptId: string,
		versionId: string,
		instanceId: string,
		model: string
	) => void
	updatePlaygroundMessages: (
		promptId: string,
		versionId: string,
		instanceId: string,
		messages: Message[]
	) => void
	updatePlaygroundLoading: (
		promptId: string,
		versionId: string,
		instanceId: string,
		isLoading: boolean
	) => void
	// Helper to get current version's playground instances
	getCurrentPlaygroundInstances: () => PlaygroundInstance[]
	// Updated table-related methods to work with prompt-level inputs and version-level responses
	getTableData: (
		promptId: string | null,
		versionId: string | null
	) => TableRow[]
	addTableRow: (promptId: string, initialInput?: string) => void
	removeTableRow: (promptId: string, rowId: string) => void
	updateTableRowInput: (
		promptId: string,
		rowId: string,
		input: string,
		images?: UploadedImage[]
	) => void
	getTableCellResponse: (
		promptId: string,
		versionId: string,
		rowId: string,
		modelId: string
	) => string | null
	updateTableCellResponse: (
		promptId: string,
		versionId: string,
		rowId: string,
		modelId: string,
		response: string
	) => void
}

// Available models configuration
export const AVAILABLE_MODELS = [
	{ id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
	{ id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
	{ id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
	{
		id: 'claude-3-5-sonnet-20241022',
		name: 'Claude 3.5 Sonnet',
		provider: 'anthropic',
	},
	{
		id: 'claude-3-5-haiku-20241022',
		name: 'Claude 3.5 Haiku',
		provider: 'anthropic',
	},
] as const

export const useSystemPromptStore = create<SystemPromptState>()(
	persist(
		(set, get) => ({
			activePromptId: null,
			activeVersionId: null,
			prompts: [],
			clearChatMessages: null,
			hasHydrated: false,
			setActivePromptId: (id: string | null) => {
				if (id) {
					const state = get()
					const prompt = state.prompts.find((p) => p.id === id)
					if (prompt && prompt.versions.length > 0) {
						// Set to the latest version of this prompt
						const latestVersion = prompt.versions[prompt.versions.length - 1]
						set({
							activePromptId: id,
							activeVersionId: latestVersion.versionId,
						})
					} else {
						set({ activePromptId: id, activeVersionId: null })
					}
				} else {
					set({ activePromptId: id, activeVersionId: null })
				}
			},
			setActiveVersionId: (id: string | null) => set({ activeVersionId: id }),
			addPrompt: (content: string) => {
				const newVersion: PromptVersion = {
					versionId: crypto.randomUUID(),
					title: '',
					content,
					timestamp: Date.now(),
					// Initialize with one default playground instance
					playgroundInstances: [
						{
							id: crypto.randomUUID(),
							selectedModel: 'gpt-4o',
							messages: [],
							isLoading: false,
							conversationHistory: null,
						},
					],
					// Initialize empty responses
					responses: {},
				}
				const newPrompt: Prompt = {
					id: crypto.randomUUID(),
					versions: [newVersion],
					// Initialize with one default input row with example content
					inputRows: [
						{
							id: crypto.randomUUID(),
							input: 'example input',
							images: [],
							timestamp: Date.now(),
						},
					],
					// Initialize empty variables
					variables: {},
				}
				set((state) => ({
					prompts: [...state.prompts, newPrompt],
					activePromptId: newPrompt.id,
					activeVersionId: newVersion.versionId,
				}))
			},
			deletePrompt: (id: string) => {
				set((state) => ({
					prompts: state.prompts.filter((prompt) => prompt.id !== id),
					activePromptId:
						state.activePromptId === id ? null : state.activePromptId,
				}))
			},
			deleteVersion: (promptId: string, versionId: string) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) => {
						if (prompt.id !== promptId) return prompt
						// Don't allow deleting if only one version remains
						if (prompt.versions.length <= 1) return prompt

						const newVersions = prompt.versions.filter(
							(v) => v.versionId !== versionId
						)
						// If we're deleting the active version, set the latest one as active
						if (state.activeVersionId === versionId) {
							const latestVersion = newVersions[newVersions.length - 1]
							state.activeVersionId = latestVersion.versionId
						}
						return {
							...prompt,
							versions: newVersions,
						}
					}),
				}))
			},
			updatePrompt: (id: string, newContent: string) => {
				const newVersionId = crypto.randomUUID()
				const state = get()

				// Get current version's playground instances to copy to new version
				const currentPrompt = state.prompts.find((p) => p.id === id)
				const currentVersion = currentPrompt?.versions.find(
					(v) => v.versionId === state.activeVersionId
				)
				const currentPlaygroundInstances =
					currentVersion?.playgroundInstances || [
						{
							id: crypto.randomUUID(),
							selectedModel: 'gpt-4o',
							messages: [],
							isLoading: false,
							conversationHistory: null,
						},
					]

				// Create new playground instances (copy configuration but reset conversations)
				const newPlaygroundInstances = currentPlaygroundInstances.map(
					(instance) => ({
						id: crypto.randomUUID(),
						selectedModel: instance.selectedModel, // Keep model selection
						messages: [],
						isLoading: false,
						conversationHistory: null, // Reset conversation for new version
					})
				)

				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === id
							? {
									...prompt,
									versions: [
										...prompt.versions,
										{
											versionId: newVersionId,
											title: currentVersion?.title || '',
											content: newContent,
											timestamp: Date.now(),
											playgroundInstances: newPlaygroundInstances,
											// Initialize empty responses for new version
											responses: {},
										},
									],
							  }
							: prompt
					),
					activeVersionId: newVersionId,
				}))
			},
			updatePromptTitle: (
				promptId: string,
				versionId: string,
				title: string
			) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									versions: prompt.versions.map((version) =>
										version.versionId === versionId
											? { ...version, title }
											: version
									),
							  }
							: prompt
					),
				}))
			},
			revertPromptVersion: (promptId: string, versionId: string) => {
				set({ activePromptId: promptId, activeVersionId: versionId })
			},
			setClearChatMessages: (clearFn: () => void) =>
				set({ clearChatMessages: clearFn }),
			// Save conversation history to specific playground instance within version
			saveConversationHistory: (
				promptId: string,
				versionId: string,
				playgroundId: string,
				messages: Message[]
			) => {
				const messagesToSave = messages
					.filter((msg) => msg.role !== 'system')
					.map((msg) => {
						let extractedContent = msg.content || ''

						// If content is empty but parts exist, extract text from parts
						if (!extractedContent && msg.parts && msg.parts.length > 0) {
							extractedContent = msg.parts
								.filter((p) => p.type === 'text' || p.type === 'step-start')
								.map((p: { type: string; text?: string }) => {
									// Handle different part types
									if (p.type === 'text') {
										return p.text || ''
									} else if (p.type === 'step-start') {
										// For step-start, return empty string as it doesn't contain actual content
										return ''
									}
									return ''
								})
								.join('')
						}

						// If still no content, check if the message has a content field elsewhere
						if (
							!extractedContent &&
							(msg as Message & { content?: string }).content
						) {
							extractedContent = (msg as Message & { content?: string }).content
						}

						return {
							...msg,
							content: extractedContent,
						}
					})

				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									versions: prompt.versions.map((version) =>
										version.versionId === versionId
											? {
													...version,
													playgroundInstances: version.playgroundInstances.map(
														(instance) =>
															instance.id === playgroundId
																? {
																		...instance,
																		conversationHistory: {
																			messages: messagesToSave,
																			lastUpdated: Date.now(),
																		},
																  }
																: instance
													),
											  }
											: version
									),
							  }
							: prompt
					),
				}))
			},
			// Get conversation history from specific playground instance within version
			getConversationHistory: (
				promptId: string,
				versionId: string,
				playgroundId: string
			): Message[] | null => {
				const state = get()
				const prompt = state.prompts.find((p: Prompt) => p.id === promptId)
				const version = prompt?.versions.find(
					(v: PromptVersion) => v.versionId === versionId
				)
				const instance = version?.playgroundInstances.find(
					(i: PlaygroundInstance) => i.id === playgroundId
				)
				return instance?.conversationHistory?.messages || null
			},
			// Clear conversation history for specific playground instance within version
			clearConversationHistory: (
				promptId: string,
				versionId: string,
				playgroundId: string
			) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									versions: prompt.versions.map((version) =>
										version.versionId === versionId
											? {
													...version,
													playgroundInstances: version.playgroundInstances.map(
														(instance) =>
															instance.id === playgroundId
																? {
																		...instance,
																		conversationHistory: null,
																  }
																: instance
													),
											  }
											: version
									),
							  }
							: prompt
					),
				}))
			},
			// Add playground instance to specific version
			addPlaygroundInstance: (promptId: string, versionId: string) => {
				const newInstance: PlaygroundInstance = {
					id: crypto.randomUUID(),
					selectedModel: 'gpt-4o',
					messages: [],
					isLoading: false,
					conversationHistory: null,
				}
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									versions: prompt.versions.map((version) =>
										version.versionId === versionId
											? {
													...version,
													playgroundInstances: [
														...version.playgroundInstances,
														newInstance,
													],
											  }
											: version
									),
							  }
							: prompt
					),
				}))
			},
			// Remove playground instance from specific version
			removePlaygroundInstance: (
				promptId: string,
				versionId: string,
				instanceId: string
			) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									versions: prompt.versions.map((version) =>
										version.versionId === versionId
											? {
													...version,
													playgroundInstances:
														version.playgroundInstances.filter(
															(instance) => instance.id !== instanceId
														),
											  }
											: version
									),
							  }
							: prompt
					),
				}))
			},
			// Update playground model for specific version
			updatePlaygroundModel: (
				promptId: string,
				versionId: string,
				instanceId: string,
				model: string
			) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									versions: prompt.versions.map((version) =>
										version.versionId === versionId
											? {
													...version,
													playgroundInstances: version.playgroundInstances.map(
														(instance) =>
															instance.id === instanceId
																? { ...instance, selectedModel: model }
																: instance
													),
											  }
											: version
									),
							  }
							: prompt
					),
				}))
			},
			// Update playground messages for specific version
			updatePlaygroundMessages: (
				promptId: string,
				versionId: string,
				instanceId: string,
				messages: Message[]
			) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									versions: prompt.versions.map((version) =>
										version.versionId === versionId
											? {
													...version,
													playgroundInstances: version.playgroundInstances.map(
														(instance) =>
															instance.id === instanceId
																? { ...instance, messages }
																: instance
													),
											  }
											: version
									),
							  }
							: prompt
					),
				}))
			},
			// Update playground loading state for specific version
			updatePlaygroundLoading: (
				promptId: string,
				versionId: string,
				instanceId: string,
				isLoading: boolean
			) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									versions: prompt.versions.map((version) =>
										version.versionId === versionId
											? {
													...version,
													playgroundInstances: version.playgroundInstances.map(
														(instance) =>
															instance.id === instanceId
																? { ...instance, isLoading }
																: instance
													),
											  }
											: version
									),
							  }
							: prompt
					),
				}))
			},
			// Helper to get current version's playground instances
			getCurrentPlaygroundInstances: (): PlaygroundInstance[] => {
				const state = get()
				if (!state.activePromptId || !state.activeVersionId) {
					return []
				}
				const prompt = state.prompts.find(
					(p: Prompt) => p.id === state.activePromptId
				)
				const version = prompt?.versions.find(
					(v: PromptVersion) => v.versionId === state.activeVersionId
				)
				return version?.playgroundInstances || []
			},
			// Updated table-related methods to work with prompt-level inputs and version-level responses
			getTableData: (
				promptId: string | null,
				versionId: string | null
			): TableRow[] => {
				if (!promptId || !versionId) return []
				const state = get()
				const prompt = state.prompts.find((p) => p.id === promptId)
				const version = prompt?.versions.find((v) => v.versionId === versionId)

				// Combine input data from prompt with responses from version
				return (prompt?.inputRows || []).map((inputRow) => ({
					...inputRow,
					responses: version?.responses[inputRow.id] || {},
				}))
			},
			addTableRow: (promptId: string, initialInput?: string) => {
				const newRow: InputRow = {
					id: crypto.randomUUID(),
					input: initialInput || '',
					images: [],
					timestamp: Date.now(),
				}
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									inputRows: [newRow, ...(prompt.inputRows || [])],
							  }
							: prompt
					),
				}))
			},
			removeTableRow: (promptId: string, rowId: string) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									inputRows: (prompt.inputRows || []).filter(
										(row) => row.id !== rowId
									),
									// Also remove responses for this row from all versions
									versions: prompt.versions.map((version) => ({
										...version,
										responses: Object.fromEntries(
											Object.entries(version.responses).filter(
												([rId]) => rId !== rowId
											)
										),
									})),
							  }
							: prompt
					),
				}))
			},
			updateTableRowInput: (
				promptId: string,
				rowId: string,
				input: string,
				images: UploadedImage[] = []
			) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									inputRows: (prompt.inputRows || []).map((row) =>
										row.id === rowId ? { ...row, input, images } : row
									),
							  }
							: prompt
					),
				}))
			},
			getTableCellResponse: (
				promptId: string,
				versionId: string,
				rowId: string,
				modelId: string
			): string | null => {
				const state = get()
				const prompt = state.prompts.find((p) => p.id === promptId)
				const version = prompt?.versions.find((v) => v.versionId === versionId)
				return version?.responses[rowId]?.[modelId] || null
			},
			updateTableCellResponse: (
				promptId: string,
				versionId: string,
				rowId: string,
				modelId: string,
				response: string
			) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									versions: prompt.versions.map((version) =>
										version.versionId === versionId
											? {
													...version,
													responses: {
														...version.responses,
														[rowId]: {
															...(version.responses[rowId] || {}),
															[modelId]: response,
														},
													},
											  }
											: version
									),
							  }
							: prompt
					),
				}))
			},
			// Update variable management methods to work at prompt level
			getPromptVariables: (promptId: string) => {
				const state = get()
				const prompt = state.prompts.find((p) => p.id === promptId)
				return prompt?.variables || {}
			},
			updatePromptVariable: (promptId: string, key: string, value: string) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									variables: {
										...prompt.variables,
										[key]: value,
									},
							  }
							: prompt
					),
				}))
			},
			deletePromptVariable: (promptId: string, key: string) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									variables: Object.fromEntries(
										Object.entries(prompt.variables).filter(([k]) => k !== key)
									),
							  }
							: prompt
					),
				}))
			},
			// Function to substitute variables in prompt content
			substituteVariables: (
				promptId: string,
				versionId: string,
				content: string
			) => {
				const state = get()
				const variables = state.getPromptVariables(promptId)

				// Replace both {{variable}} and ${variable} formats
				let result = content

				// Replace {{variable}} format
				result = result.replace(/\{\{(.*?)\}\}/g, (match, key) => {
					const trimmedKey = key.trim()
					return variables[trimmedKey] || match
				})

				// Replace ${variable} format
				result = result.replace(/\$\{([^}]*)\}/g, (match, key) => {
					const trimmedKey = key.trim()
					return variables[trimmedKey] || match
				})

				return result
			},
		}),
		{
			name: 'system-prompt-storage',
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => (state) => {
				if (state) state.hasHydrated = true
			},
		}
	)
)

// API Keys management
interface ApiKeyStore {
	openaiKey: string
	anthropicKey: string
	setOpenaiKey: (key: string) => void
	setAnthropicKey: (key: string) => void
	clearKeys: () => void
	hasValidKeys: () => boolean
}

// Utility functions for localStorage API key management
export const apiKeyStorage = {
	getOpenAIKey: (): string => {
		if (typeof window === 'undefined') return ''
		return localStorage.getItem('eggcellent_openai_key') || ''
	},
	setOpenAIKey: (key: string) => {
		if (typeof window === 'undefined') return
		if (key.trim()) {
			localStorage.setItem('eggcellent_openai_key', key.trim())
		} else {
			localStorage.removeItem('eggcellent_openai_key')
		}
	},
	getAnthropicKey: (): string => {
		if (typeof window === 'undefined') return ''
		return localStorage.getItem('eggcellent_anthropic_key') || ''
	},
	setAnthropicKey: (key: string) => {
		if (typeof window === 'undefined') return
		if (key.trim()) {
			localStorage.setItem('eggcellent_anthropic_key', key.trim())
		} else {
			localStorage.removeItem('eggcellent_anthropic_key')
		}
	},
	clearAll: () => {
		if (typeof window === 'undefined') return
		localStorage.removeItem('eggcellent_openai_key')
		localStorage.removeItem('eggcellent_anthropic_key')
	},
}

// API Key store
export const useApiKeyStore = create<ApiKeyStore>()((set, get) => ({
	openaiKey: '',
	anthropicKey: '',
	setOpenaiKey: (key: string) => {
		apiKeyStorage.setOpenAIKey(key)
		set({ openaiKey: key })
	},
	setAnthropicKey: (key: string) => {
		apiKeyStorage.setAnthropicKey(key)
		set({ anthropicKey: key })
	},
	clearKeys: () => {
		apiKeyStorage.clearAll()
		set({ openaiKey: '', anthropicKey: '' })
	},
	hasValidKeys: () => {
		// Return false during SSR to prevent hydration mismatch
		if (typeof window === 'undefined') return false
		const state = get()
		return Boolean(state.openaiKey.trim() || state.anthropicKey.trim())
	},
}))

// Initialize API keys from localStorage on app start (client-side only)
if (typeof window !== 'undefined') {
	// Use a small delay to ensure hydration is complete
	setTimeout(() => {
		const openaiKey = apiKeyStorage.getOpenAIKey()
		const anthropicKey = apiKeyStorage.getAnthropicKey()

		if (openaiKey || anthropicKey) {
			useApiKeyStore.getState().setOpenaiKey(openaiKey)
			useApiKeyStore.getState().setAnthropicKey(anthropicKey)
		}
	}, 100)
}

// Utility function to detect variables in prompt content
export const detectVariables = (content: string): string[] => {
	// Detect both {{variable}} and ${variable} formats
	const curlyBraceRegex = /\{\{(.*?)\}\}/g
	const dollarBraceRegex = /\$\{([^}]*)\}/g

	const curlyBraceMatches = content.match(curlyBraceRegex) || []
	const dollarBraceMatches = content.match(dollarBraceRegex) || []

	const allVariables = [
		...curlyBraceMatches.map((match) => match.replace(/\{\{|\}\}/g, '').trim()),
		...dollarBraceMatches.map((match) => match.replace(/\$\{|\}/g, '').trim()),
	]

	// Remove duplicates and empty strings
	return allVariables
		.filter((variable) => variable.length > 0)
		.filter((variable, index, array) => array.indexOf(variable) === index)
}
