// User data structure for both auth and Firestore storage
export interface UserData {
	userId: string // Firebase Auth uid
	displayName?: string | null
	email?: string | null
	photoURL?: string | null
	// Firestore-specific fields (optional for auth use cases)
	credits?: number
	createdAt?: number
	lastSynced?: number
	version?: number // For conflict resolution
}

// Prompt document structure for subcollection
export interface PromptDoc {
	id: string
	title?: string
	content?: string
	timestamp: number
	version?: number
	[key: string]: unknown
}

// Common response types for Firebase operations
export interface SyncResponse {
	success: boolean
	error?: string
}
