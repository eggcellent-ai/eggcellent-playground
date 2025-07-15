import {
	doc,
	setDoc,
	getDoc,
	deleteDoc,
	onSnapshot,
	type Unsubscribe,
} from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import app from './firebase'

// Initialize Firestore
export const db = getFirestore(app)

// User data structure for Firestore
interface UserData {
	userId: string
	prompts: Record<string, unknown>[]
	lastSynced: number
	version: number // For conflict resolution
}

// Firestore service for data synchronization
export class FirestoreService {
	private userId: string | null = null
	private syncEnabled: boolean = false
	private listeners: Unsubscribe[] = []

	// Enable sync for authenticated user
	enableSync(userId: string) {
		this.userId = userId
		this.syncEnabled = true
		console.log('Firestore sync enabled for user:', userId)
	}

	// Disable sync (user logged out)
	disableSync() {
		this.userId = null
		this.syncEnabled = false
		this.removeAllListeners()
		console.log('Firestore sync disabled')
	}

	// Check if sync is enabled
	isSyncEnabled(): boolean {
		return this.syncEnabled && this.userId !== null
	}

	// Get user document reference
	private getUserDoc() {
		if (!this.userId) throw new Error('User not authenticated')
		return doc(db, 'users', this.userId)
	}

	// Sync prompts to Firestore
	async syncPrompts(prompts: Record<string, unknown>[]): Promise<void> {
		if (!this.isSyncEnabled()) return

		try {
			const userData: Partial<UserData> = {
				userId: this.userId!,
				prompts,
				lastSynced: Date.now(),
				version: Date.now(), // Use timestamp as version
			}

			await setDoc(this.getUserDoc(), userData, { merge: true })
			console.log('Prompts synced to Firestore')
		} catch (error) {
			console.error('Error syncing prompts:', error)
			throw error
		}
	}

	// Sync all user data (now only prompts)
	async syncAllData(prompts: Record<string, unknown>[]): Promise<void> {
		if (!this.isSyncEnabled()) return

		try {
			const userData: UserData = {
				userId: this.userId!,
				prompts,
				lastSynced: Date.now(),
				version: Date.now(),
			}

			await setDoc(this.getUserDoc(), userData)
			console.log('All data synced to Firestore')
		} catch (error) {
			console.error('Error syncing all data:', error)
			throw error
		}
	}

	// Load user data from Firestore
	async loadUserData(): Promise<{ prompts: Record<string, unknown>[] } | null> {
		if (!this.isSyncEnabled()) return null

		try {
			const docSnap = await getDoc(this.getUserDoc())

			if (docSnap.exists()) {
				const data = docSnap.data() as UserData
				console.log('Data loaded from Firestore')
				return {
					prompts: data.prompts || [],
				}
			}

			return null
		} catch (error) {
			console.error('Error loading user data:', error)
			throw error
		}
	}

	// Set up real-time listener for data changes
	setupRealtimeSync(
		onDataChange: (data: { prompts: Record<string, unknown>[] }) => void
	): void {
		if (!this.isSyncEnabled()) return

		const unsubscribe = onSnapshot(
			this.getUserDoc(),
			(doc) => {
				if (doc.exists()) {
					const data = doc.data() as UserData
					onDataChange({
						prompts: data.prompts || [],
					})
				}
			},
			(error) => {
				console.error('Firestore listener error:', error)
			}
		)

		this.listeners.push(unsubscribe)
	}

	// Remove all listeners
	private removeAllListeners(): void {
		this.listeners.forEach((unsubscribe) => unsubscribe())
		this.listeners = []
	}

	// Delete user data from Firestore
	async deleteUserData(): Promise<void> {
		if (!this.isSyncEnabled()) return

		try {
			await deleteDoc(this.getUserDoc())
			console.log('User data deleted from Firestore')
		} catch (error) {
			console.error('Error deleting user data:', error)
			throw error
		}
	}

	// Check if user has data in Firestore
	async hasUserData(): Promise<boolean> {
		if (!this.isSyncEnabled()) return false

		try {
			const docSnap = await getDoc(this.getUserDoc())
			return docSnap.exists()
		} catch (error) {
			console.error('Error checking user data:', error)
			return false
		}
	}

	// Merge local and cloud data (conflict resolution)
	mergeData(
		localData: { prompts: Record<string, unknown>[] },
		cloudData: { prompts: Record<string, unknown>[] }
	): { prompts: Record<string, unknown>[] } {
		if (!cloudData) return localData
		if (!localData) return cloudData

		const mergedPrompts = this.mergePrompts(
			localData.prompts,
			cloudData.prompts
		)
		return {
			prompts: mergedPrompts,
		}
	}

	private mergePrompts(
		localPrompts: Record<string, unknown>[],
		cloudPrompts: Record<string, unknown>[]
	): Record<string, unknown>[] {
		const promptMap = new Map()
		localPrompts.forEach((prompt) => {
			promptMap.set((prompt as { id: string }).id, prompt)
		})
		cloudPrompts.forEach((prompt) => {
			const existing = promptMap.get((prompt as { id: string }).id)
			if (
				!existing ||
				(prompt as { timestamp: number }).timestamp >
					(existing as { timestamp: number }).timestamp
			) {
				promptMap.set((prompt as { id: string }).id, prompt)
			}
		})
		return Array.from(promptMap.values())
	}
}

export const firestoreService = new FirestoreService()
