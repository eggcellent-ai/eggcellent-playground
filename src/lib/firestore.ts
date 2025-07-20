import {
	doc,
	setDoc,
	getDoc,
	deleteDoc,
	onSnapshot,
	collection,
	updateDoc,
	getDocs,
	query,
	orderBy,
	writeBatch,
	type Unsubscribe,
} from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import app from './firebase'
import type { UserData, PromptDoc } from './types'

// Initialize Firestore
export const db = getFirestore(app)

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

	// Get prompts subcollection reference
	private getPromptsCollection() {
		if (!this.userId) throw new Error('User not authenticated')
		return collection(db, 'users', this.userId, 'prompts')
	}

	// Sync prompts to Firestore subcollection
	async syncPrompts(prompts: Record<string, unknown>[]): Promise<void> {
		if (!this.isSyncEnabled()) return

		try {
			const batch = writeBatch(db)
			const promptsCollection = this.getPromptsCollection()

			// Clear existing prompts and add new ones
			const existingPrompts = await getDocs(promptsCollection)
			existingPrompts.docs.forEach((doc) => {
				batch.delete(doc.ref)
			})

			// Add new prompts
			prompts.forEach((prompt) => {
				const promptDoc: PromptDoc = {
					...prompt,
					id: (prompt as { id: string }).id || Date.now().toString(),
					timestamp: (prompt as { timestamp?: number }).timestamp || Date.now(),
					version: Date.now(),
				} as PromptDoc

				const docRef = doc(promptsCollection, promptDoc.id)
				batch.set(docRef, promptDoc)
			})

			await batch.commit()

			// Update user's lastSynced timestamp
			await setDoc(
				this.getUserDoc(),
				{
					lastSynced: Date.now(),
					version: Date.now(),
				},
				{ merge: true }
			)

			console.log('Prompts synced to Firestore subcollection')
		} catch (error) {
			console.error('Error syncing prompts:', error)
			throw error
		}
	}

	// Sync all user data (prompts via subcollection)
	async syncAllData(prompts: Record<string, unknown>[]): Promise<void> {
		if (!this.isSyncEnabled()) return

		try {
			// Sync prompts to subcollection
			await this.syncPrompts(prompts)

			// Update user document metadata
			const userData: Partial<UserData> = {
				userId: this.userId!,
				lastSynced: Date.now(),
				version: Date.now(),
			}

			await setDoc(this.getUserDoc(), userData, { merge: true })
			console.log('All data synced to Firestore')
		} catch (error) {
			console.error('Error syncing all data:', error)
			throw error
		}
	}

	// Load user data from Firestore (including prompts from subcollection)
	async loadUserData(): Promise<{ prompts: Record<string, unknown>[] } | null> {
		if (!this.isSyncEnabled()) return null

		try {
			// Load prompts from subcollection
			const promptsCollection = this.getPromptsCollection()
			const promptsQuery = query(
				promptsCollection,
				orderBy('timestamp', 'desc')
			)
			const promptsSnapshot = await getDocs(promptsQuery)

			const prompts: Record<string, unknown>[] = promptsSnapshot.docs.map(
				(doc) => {
					const data = doc.data() as PromptDoc
					return {
						...data,
						id: doc.id,
					}
				}
			)

			console.log(
				`Loaded ${prompts.length} prompts from Firestore subcollection`
			)
			return { prompts }
		} catch (error) {
			console.error('Error loading user data:', error)
			throw error
		}
	}

	// Add a single prompt to subcollection
	async addPrompt(prompt: Record<string, unknown>): Promise<string> {
		if (!this.isSyncEnabled()) throw new Error('Sync not enabled')

		try {
			const promptsCollection = this.getPromptsCollection()
			const promptDoc: PromptDoc = {
				...prompt,
				id: (prompt as { id: string }).id || Date.now().toString(),
				timestamp: Date.now(),
				version: Date.now(),
			} as PromptDoc

			const docRef = doc(promptsCollection, promptDoc.id)
			await setDoc(docRef, promptDoc)

			// Update user's lastSynced
			await setDoc(
				this.getUserDoc(),
				{
					lastSynced: Date.now(),
					version: Date.now(),
				},
				{ merge: true }
			)

			console.log('Prompt added to Firestore subcollection')
			return promptDoc.id
		} catch (error) {
			console.error('Error adding prompt:', error)
			throw error
		}
	}

	// Update a single prompt in subcollection
	async updatePrompt(
		promptId: string,
		updates: Partial<Record<string, unknown>>
	): Promise<void> {
		if (!this.isSyncEnabled()) throw new Error('Sync not enabled')

		try {
			const promptsCollection = this.getPromptsCollection()
			const promptDoc = doc(promptsCollection, promptId)

			await updateDoc(promptDoc, {
				...updates,
				timestamp: Date.now(),
				version: Date.now(),
			})

			// Update user's lastSynced
			await setDoc(
				this.getUserDoc(),
				{
					lastSynced: Date.now(),
					version: Date.now(),
				},
				{ merge: true }
			)

			console.log('Prompt updated in Firestore subcollection')
		} catch (error) {
			console.error('Error updating prompt:', error)
			throw error
		}
	}

	// Delete a single prompt from subcollection
	async deletePrompt(promptId: string): Promise<void> {
		if (!this.isSyncEnabled()) throw new Error('Sync not enabled')

		try {
			const promptsCollection = this.getPromptsCollection()
			const promptDoc = doc(promptsCollection, promptId)

			await deleteDoc(promptDoc)

			// Update user's lastSynced
			await setDoc(
				this.getUserDoc(),
				{
					lastSynced: Date.now(),
					version: Date.now(),
				},
				{ merge: true }
			)

			console.log('Prompt deleted from Firestore subcollection')
		} catch (error) {
			console.error('Error deleting prompt:', error)
			throw error
		}
	}

	// Set up real-time listener for prompts changes
	setupRealtimeSync(
		onDataChange: (data: { prompts: Record<string, unknown>[] }) => void
	): void {
		if (!this.isSyncEnabled()) return

		// Listen to prompts subcollection changes
		const promptsCollection = this.getPromptsCollection()
		const promptsQuery = query(promptsCollection, orderBy('timestamp', 'desc'))

		const unsubscribe = onSnapshot(
			promptsQuery,
			(snapshot) => {
				const prompts: Record<string, unknown>[] = snapshot.docs.map((doc) => {
					const data = doc.data() as PromptDoc
					return {
						...data,
						id: doc.id,
					}
				})

				onDataChange({ prompts })
				console.log(`Real-time update: ${prompts.length} prompts`)
			},
			(error) => {
				console.error('Firestore prompts listener error:', error)
			}
		)

		this.listeners.push(unsubscribe)
	}

	// Remove all listeners
	private removeAllListeners(): void {
		this.listeners.forEach((unsubscribe) => unsubscribe())
		this.listeners = []
	}

	// Delete user data from Firestore (including prompts subcollection)
	async deleteUserData(): Promise<void> {
		if (!this.isSyncEnabled()) return

		try {
			const batch = writeBatch(db)

			// Delete all prompts in subcollection
			const promptsCollection = this.getPromptsCollection()
			const promptsSnapshot = await getDocs(promptsCollection)
			promptsSnapshot.docs.forEach((doc) => {
				batch.delete(doc.ref)
			})

			// Delete user document
			batch.delete(this.getUserDoc())

			await batch.commit()
			console.log('User data and prompts deleted from Firestore')
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

	// Sync user profile to Firestore
	async syncUserProfile(user: UserData): Promise<void> {
		if (!this.isSyncEnabled()) return

		try {
			// Check if user document already exists
			const docSnap = await getDoc(this.getUserDoc())

			const profileData: Partial<UserData> = {
				userId: user.userId,
				displayName: user.displayName,
				email: user.email,
				photoURL: user.photoURL,
				lastSynced: Date.now(),
				version: Date.now(),
			}

			if (!docSnap.exists()) {
				// Create new user document with default values
				const newUserData: UserData = {
					...profileData,
					credits: 1, // Default credits for new users
					createdAt: Date.now(),
				} as UserData

				await setDoc(this.getUserDoc(), newUserData)
				console.log('New user profile created in Firestore')
			} else {
				// Update existing user document with profile info
				await setDoc(this.getUserDoc(), profileData, { merge: true })
				console.log('User profile updated in Firestore')
			}
		} catch (error) {
			console.error('Error syncing user profile:', error)
			throw error
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
