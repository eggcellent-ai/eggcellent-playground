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
	// Store selected models for table layout
	selectedModels?: string[]
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
		_versionId: string,
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
	// Selected models management
	getSelectedModels: (
		promptId: string | null,
		versionId: string | null
	) => string[]
	updateSelectedModels: (
		promptId: string,
		versionId: string,
		models: string[]
	) => void
}

// Available models configuration
export const AVAILABLE_MODELS = [
	// OpenAI Models
	{ id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
	{ id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
	{ id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
	{ id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
	{ id: 'o1-preview', name: 'o1 Preview', provider: 'OpenAI' },
	{ id: 'o1-mini', name: 'o1 Mini', provider: 'OpenAI' },

	// Anthropic Models
	{
		id: 'claude-3-5-sonnet-20241022',
		name: 'Claude 3.5 Sonnet',
		provider: 'Anthropic',
	},
	{
		id: 'claude-3-5-haiku-20241022',
		name: 'Claude 3.5 Haiku',
		provider: 'Anthropic',
	},
	{
		id: 'claude-3-opus-20240229',
		name: 'Claude 3 Opus',
		provider: 'Anthropic',
	},
	{
		id: 'claude-3-sonnet-20240229',
		name: 'Claude 3 Sonnet',
		provider: 'Anthropic',
	},
	{
		id: 'claude-3-haiku-20240307',
		name: 'Claude 3 Haiku',
		provider: 'Anthropic',
	},

	// xAI Models
	{ id: 'grok-beta', name: 'Grok Beta', provider: 'xAI' },
	{ id: 'grok-vision-beta', name: 'Grok Vision Beta', provider: 'xAI' },

	// Google Models
	{ id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', provider: 'Google' },
	{
		id: 'gemini-1.5-flash-latest',
		name: 'Gemini 1.5 Flash',
		provider: 'Google',
	},
	{ id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },

	// Mistral Models
	{ id: 'mistral-large-latest', name: 'Mistral Large', provider: 'Mistral' },
	{ id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'Mistral' },
	{ id: 'mistral-small-latest', name: 'Mistral Small', provider: 'Mistral' },
	{ id: 'open-mistral-7b', name: 'Mistral 7B', provider: 'Mistral' },
	{ id: 'open-mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'Mistral' },
	{ id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'Mistral' },

	// Groq Models (Fast Inference)
	{ id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'Groq' },
	{ id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Groq' },
	{ id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Groq' },
	{ id: 'gemma-7b-it', name: 'Gemma 7B', provider: 'Groq' },

	// DeepSeek Models
	{ id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
	{ id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek' },

	// Together.ai Models
	{
		id: 'meta-llama/Llama-2-70b-chat-hf',
		name: 'Llama 2 70B Chat',
		provider: 'Together.ai',
	},
	{
		id: 'meta-llama/Llama-2-13b-chat-hf',
		name: 'Llama 2 13B Chat',
		provider: 'Together.ai',
	},
	{
		id: 'meta-llama/Llama-2-7b-chat-hf',
		name: 'Llama 2 7B Chat',
		provider: 'Together.ai',
	},
	{
		id: 'meta-llama/Meta-Llama-3-70B-Instruct',
		name: 'Llama 3 70B Instruct',
		provider: 'Together.ai',
	},
	{
		id: 'meta-llama/Meta-Llama-3-8B-Instruct',
		name: 'Llama 3 8B Instruct',
		provider: 'Together.ai',
	},
	{
		id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
		name: 'Mixtral 8x7B Instruct',
		provider: 'Together.ai',
	},
	{
		id: 'mistralai/Mistral-7B-Instruct-v0.1',
		name: 'Mistral 7B Instruct',
		provider: 'Together.ai',
	},
	{
		id: 'togethercomputer/RedPajama-INCITE-Chat-3B-v1',
		name: 'RedPajama Chat 3B',
		provider: 'Together.ai',
	},

	// Perplexity Models
	{
		id: 'llama-3.1-sonar-small-128k-online',
		name: 'Sonar Small Online',
		provider: 'Perplexity',
	},
	{
		id: 'llama-3.1-sonar-large-128k-online',
		name: 'Sonar Large Online',
		provider: 'Perplexity',
	},
	{
		id: 'llama-3.1-sonar-huge-128k-online',
		name: 'Sonar Huge Online',
		provider: 'Perplexity',
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
					// Initialize with default models
					selectedModels: [AVAILABLE_MODELS[0].id, AVAILABLE_MODELS[1].id],
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
											// Copy selected models from current version or use defaults
											selectedModels: currentVersion?.selectedModels || [
												AVAILABLE_MODELS[0].id,
												AVAILABLE_MODELS[1].id,
											],
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
				_versionId: string,
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
			// Selected models management
			getSelectedModels: (
				promptId: string | null,
				versionId: string | null
			): string[] => {
				if (!promptId || !versionId)
					return [AVAILABLE_MODELS[0].id, AVAILABLE_MODELS[1].id]
				const state = get()
				const prompt = state.prompts.find((p) => p.id === promptId)
				const version = prompt?.versions.find((v) => v.versionId === versionId)
				return (
					version?.selectedModels || [
						AVAILABLE_MODELS[0].id,
						AVAILABLE_MODELS[1].id,
					]
				)
			},
			updateSelectedModels: (
				promptId: string,
				versionId: string,
				models: string[]
			) => {
				set((state) => ({
					prompts: state.prompts.map((prompt) =>
						prompt.id === promptId
							? {
									...prompt,
									versions: prompt.versions.map((version) =>
										version.versionId === versionId
											? { ...version, selectedModels: models }
											: version
									),
							  }
							: prompt
					),
				}))
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
	xaiKey: string
	googleKey: string
	mistralKey: string
	groqKey: string
	deepseekKey: string
	togetheraiKey: string
	perplexityKey: string
	setOpenaiKey: (key: string) => void
	setAnthropicKey: (key: string) => void
	setXaiKey: (key: string) => void
	setGoogleKey: (key: string) => void
	setMistralKey: (key: string) => void
	setGroqKey: (key: string) => void
	setDeepseekKey: (key: string) => void
	setTogetheraiKey: (key: string) => void
	setPerplexityKey: (key: string) => void
	clearKeys: () => void
	hasValidKeys: () => boolean
	getKeyForProvider: (provider: string) => string
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
	getXaiKey: (): string => {
		if (typeof window === 'undefined') return ''
		return localStorage.getItem('eggcellent_xai_key') || ''
	},
	setXaiKey: (key: string) => {
		if (typeof window === 'undefined') return
		if (key.trim()) {
			localStorage.setItem('eggcellent_xai_key', key.trim())
		} else {
			localStorage.removeItem('eggcellent_xai_key')
		}
	},
	getGoogleKey: (): string => {
		if (typeof window === 'undefined') return ''
		return localStorage.getItem('eggcellent_google_key') || ''
	},
	setGoogleKey: (key: string) => {
		if (typeof window === 'undefined') return
		if (key.trim()) {
			localStorage.setItem('eggcellent_google_key', key.trim())
		} else {
			localStorage.removeItem('eggcellent_google_key')
		}
	},
	getMistralKey: (): string => {
		if (typeof window === 'undefined') return ''
		return localStorage.getItem('eggcellent_mistral_key') || ''
	},
	setMistralKey: (key: string) => {
		if (typeof window === 'undefined') return
		if (key.trim()) {
			localStorage.setItem('eggcellent_mistral_key', key.trim())
		} else {
			localStorage.removeItem('eggcellent_mistral_key')
		}
	},
	getGroqKey: (): string => {
		if (typeof window === 'undefined') return ''
		return localStorage.getItem('eggcellent_groq_key') || ''
	},
	setGroqKey: (key: string) => {
		if (typeof window === 'undefined') return
		if (key.trim()) {
			localStorage.setItem('eggcellent_groq_key', key.trim())
		} else {
			localStorage.removeItem('eggcellent_groq_key')
		}
	},
	getDeepseekKey: (): string => {
		if (typeof window === 'undefined') return ''
		return localStorage.getItem('eggcellent_deepseek_key') || ''
	},
	setDeepseekKey: (key: string) => {
		if (typeof window === 'undefined') return
		if (key.trim()) {
			localStorage.setItem('eggcellent_deepseek_key', key.trim())
		} else {
			localStorage.removeItem('eggcellent_deepseek_key')
		}
	},
	getTogetheraiKey: (): string => {
		if (typeof window === 'undefined') return ''
		return localStorage.getItem('eggcellent_togetherai_key') || ''
	},
	setTogetheraiKey: (key: string) => {
		if (typeof window === 'undefined') return
		if (key.trim()) {
			localStorage.setItem('eggcellent_togetherai_key', key.trim())
		} else {
			localStorage.removeItem('eggcellent_togetherai_key')
		}
	},
	getPerplexityKey: (): string => {
		if (typeof window === 'undefined') return ''
		return localStorage.getItem('eggcellent_perplexity_key') || ''
	},
	setPerplexityKey: (key: string) => {
		if (typeof window === 'undefined') return
		if (key.trim()) {
			localStorage.setItem('eggcellent_perplexity_key', key.trim())
		} else {
			localStorage.removeItem('eggcellent_perplexity_key')
		}
	},
	clearAll: () => {
		if (typeof window === 'undefined') return
		localStorage.removeItem('eggcellent_openai_key')
		localStorage.removeItem('eggcellent_anthropic_key')
		localStorage.removeItem('eggcellent_xai_key')
		localStorage.removeItem('eggcellent_google_key')
		localStorage.removeItem('eggcellent_mistral_key')
		localStorage.removeItem('eggcellent_groq_key')
		localStorage.removeItem('eggcellent_deepseek_key')
		localStorage.removeItem('eggcellent_togetherai_key')
		localStorage.removeItem('eggcellent_perplexity_key')
	},
}

// API Key store
export const useApiKeyStore = create<ApiKeyStore>()((set, get) => ({
	openaiKey: '',
	anthropicKey: '',
	xaiKey: '',
	googleKey: '',
	mistralKey: '',
	groqKey: '',
	deepseekKey: '',
	togetheraiKey: '',
	perplexityKey: '',
	setOpenaiKey: (key: string) => {
		apiKeyStorage.setOpenAIKey(key)
		set({ openaiKey: key })
	},
	setAnthropicKey: (key: string) => {
		apiKeyStorage.setAnthropicKey(key)
		set({ anthropicKey: key })
	},
	setXaiKey: (key: string) => {
		apiKeyStorage.setXaiKey(key)
		set({ xaiKey: key })
	},
	setGoogleKey: (key: string) => {
		apiKeyStorage.setGoogleKey(key)
		set({ googleKey: key })
	},
	setMistralKey: (key: string) => {
		apiKeyStorage.setMistralKey(key)
		set({ mistralKey: key })
	},
	setGroqKey: (key: string) => {
		apiKeyStorage.setGroqKey(key)
		set({ groqKey: key })
	},
	setDeepseekKey: (key: string) => {
		apiKeyStorage.setDeepseekKey(key)
		set({ deepseekKey: key })
	},
	setTogetheraiKey: (key: string) => {
		apiKeyStorage.setTogetheraiKey(key)
		set({ togetheraiKey: key })
	},
	setPerplexityKey: (key: string) => {
		apiKeyStorage.setPerplexityKey(key)
		set({ perplexityKey: key })
	},
	clearKeys: () => {
		apiKeyStorage.clearAll()
		set({
			openaiKey: '',
			anthropicKey: '',
			xaiKey: '',
			googleKey: '',
			mistralKey: '',
			groqKey: '',
			deepseekKey: '',
			togetheraiKey: '',
			perplexityKey: '',
		})
	},
	hasValidKeys: () => {
		// Return false during SSR to prevent hydration mismatch
		if (typeof window === 'undefined') return false
		const state = get()
		return Boolean(
			state.openaiKey.trim() ||
				state.anthropicKey.trim() ||
				state.xaiKey.trim() ||
				state.googleKey.trim() ||
				state.mistralKey.trim() ||
				state.groqKey.trim() ||
				state.deepseekKey.trim() ||
				state.togetheraiKey.trim() ||
				state.perplexityKey.trim()
		)
	},
	getKeyForProvider: (provider: string) => {
		const state = get()
		switch (provider.toLowerCase()) {
			case 'openai':
				return state.openaiKey
			case 'anthropic':
				return state.anthropicKey
			case 'xai':
				return state.xaiKey
			case 'google':
				return state.googleKey
			case 'mistral':
				return state.mistralKey
			case 'groq':
				return state.groqKey
			case 'deepseek':
				return state.deepseekKey
			case 'together.ai':
				return state.togetheraiKey
			case 'perplexity':
				return state.perplexityKey
			default:
				return ''
		}
	},
}))

// Initialize API keys from localStorage on app start (client-side only)
if (typeof window !== 'undefined') {
	// Use a small delay to ensure hydration is complete
	setTimeout(() => {
		const openaiKey = apiKeyStorage.getOpenAIKey()
		const anthropicKey = apiKeyStorage.getAnthropicKey()
		const xaiKey = apiKeyStorage.getXaiKey()
		const googleKey = apiKeyStorage.getGoogleKey()
		const mistralKey = apiKeyStorage.getMistralKey()
		const groqKey = apiKeyStorage.getGroqKey()
		const deepseekKey = apiKeyStorage.getDeepseekKey()
		const togetheraiKey = apiKeyStorage.getTogetheraiKey()
		const perplexityKey = apiKeyStorage.getPerplexityKey()

		const store = useApiKeyStore.getState()
		if (openaiKey) store.setOpenaiKey(openaiKey)
		if (anthropicKey) store.setAnthropicKey(anthropicKey)
		if (xaiKey) store.setXaiKey(xaiKey)
		if (googleKey) store.setGoogleKey(googleKey)
		if (mistralKey) store.setMistralKey(mistralKey)
		if (groqKey) store.setGroqKey(groqKey)
		if (deepseekKey) store.setDeepseekKey(deepseekKey)
		if (togetheraiKey) store.setTogetheraiKey(togetheraiKey)
		if (perplexityKey) store.setPerplexityKey(perplexityKey)
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
