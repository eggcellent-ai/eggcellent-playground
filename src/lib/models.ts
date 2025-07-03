export interface Model {
	id: string
	name: string
	provider: string
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
	{ id: 'grok-3', name: 'Grok 3', provider: 'xAI' },
	{ id: 'grok-3-fast', name: 'Grok 3 Fast', provider: 'xAI' },
	{ id: 'grok-3-mini', name: 'Grok 3 Mini', provider: 'xAI' },
	{ id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast', provider: 'xAI' },
	{ id: 'grok-2-1212', name: 'Grok 2.1', provider: 'xAI' },
	{ id: 'grok-2-vision-1212', name: 'Grok 2.1 Vision', provider: 'xAI' },
	{ id: 'grok-beta', name: 'Grok Beta', provider: 'xAI' },
	{ id: 'grok-vision-beta', name: 'Grok Vision Beta', provider: 'xAI' },

	// Google Models
	{
		id: 'gemini-2.5-pro',
		name: 'Gemini 2.5 Pro',
		provider: 'Google',
	},
	{
		id: 'gemini-2.5-flash',
		name: 'Gemini 2.5 Flash',
		provider: 'Google',
	},
	{
		id: 'gemini-2.5-pro-preview-05-06',
		name: 'Gemini 2.5 Pro Preview',
		provider: 'Google',
	},
	{
		id: 'gemini-2.5-flash-preview-04-17',
		name: 'Gemini 2.5 Flash Preview',
		provider: 'Google',
	},
	{
		id: 'gemini-2.5-pro-exp-03-25',
		name: 'Gemini 2.5 Pro Exp',
		provider: 'Google',
	},
	{
		id: 'gemini-2.0-flash',
		name: 'Gemini 2.0 Flash',
		provider: 'Google',
	},
	{
		id: 'gemini-1.5-pro',
		name: 'Gemini 1.5 Pro',
		provider: 'Google',
	},
	{
		id: 'gemini-1.5-pro-latest',
		name: 'Gemini 1.5 Pro Latest',
		provider: 'Google',
	},
	{
		id: 'gemini-1.5-flash',
		name: 'Gemini 1.5 Flash',
		provider: 'Google',
	},
	{
		id: 'gemini-1.5-flash-latest',
		name: 'Gemini 1.5 Flash Latest',
		provider: 'Google',
	},
	{
		id: 'gemini-1.5-flash-8b',
		name: 'Gemini 1.5 Flash 8B',
		provider: 'Google',
	},
	{
		id: 'gemini-1.5-flash-8b-latest',
		name: 'Gemini 1.5 Flash 8B Latest',
		provider: 'Google',
	},

	// // Mistral Models
	// { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'Mistral' },
	// { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'Mistral' },
	// { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'Mistral' },
	// { id: 'open-mistral-7b', name: 'Mistral 7B', provider: 'Mistral' },
	// { id: 'open-mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'Mistral' },
	// { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'Mistral' },

	// // Groq Models (Fast Inference)
	// { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'Groq' },
	// { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Groq' },
	// { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Groq' },
	// { id: 'gemma-7b-it', name: 'Gemma 7B', provider: 'Groq' },

	// // DeepSeek Models
	// { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
	// { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek' },

	// // Together.ai Models
	// {
	// 	id: 'meta-llama/Llama-2-70b-chat-hf',
	// 	name: 'Llama 2 70B Chat',
	// 	provider: 'Together.ai',
	// },
	// {
	// 	id: 'meta-llama/Llama-2-13b-chat-hf',
	// 	name: 'Llama 2 13B Chat',
	// 	provider: 'Together.ai',
	// },
	// {
	// 	id: 'meta-llama/Llama-2-7b-chat-hf',
	// 	name: 'Llama 2 7B Chat',
	// 	provider: 'Together.ai',
	// },
	// {
	// 	id: 'meta-llama/Meta-Llama-3-70B-Instruct',
	// 	name: 'Llama 3 70B Instruct',
	// 	provider: 'Together.ai',
	// },
	// {
	// 	id: 'meta-llama/Meta-Llama-3-8B-Instruct',
	// 	name: 'Llama 3 8B Instruct',
	// 	provider: 'Together.ai',
	// },
	// {
	// 	id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
	// 	name: 'Mixtral 8x7B Instruct',
	// 	provider: 'Together.ai',
	// },
	// {
	// 	id: 'mistralai/Mistral-7B-Instruct-v0.1',
	// 	name: 'Mistral 7B Instruct',
	// 	provider: 'Together.ai',
	// },
	// {
	// 	id: 'togethercomputer/RedPajama-INCITE-Chat-3B-v1',
	// 	name: 'RedPajama Chat 3B',
	// 	provider: 'Together.ai',
	// },

	// // Perplexity Models
	// {
	// 	id: 'llama-3.1-sonar-small-128k-online',
	// 	name: 'Sonar Small Online',
	// 	provider: 'Perplexity',
	// },
	// {
	// 	id: 'llama-3.1-sonar-large-128k-online',
	// 	name: 'Sonar Large Online',
	// 	provider: 'Perplexity',
	// },
	// {
	// 	id: 'llama-3.1-sonar-huge-128k-online',
	// 	name: 'Sonar Huge Online',
	// 	provider: 'Perplexity',
	// },
] as const
