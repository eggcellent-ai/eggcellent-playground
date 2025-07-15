import { create } from 'zustand'
import { firestoreService } from './firestore'
import { useSystemPromptStore } from './stores'

interface SyncState {
	isSyncing: boolean
	lastSyncTime: number | null
	syncError: string | null
	enableSync: (userId: string) => void
	disableSync: () => void
	syncPrompts: () => Promise<void>
	syncAllData: () => Promise<void>
	loadFromCloud: () => Promise<void>
	clearSyncError: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
	isSyncing: false,
	lastSyncTime: null,
	syncError: null,

	enableSync: (userId: string) => {
		firestoreService.enableSync(userId)
		set({ syncError: null })
	},

	disableSync: () => {
		firestoreService.disableSync()
		set({ isSyncing: false, lastSyncTime: null, syncError: null })
	},

	syncPrompts: async () => {
		if (!firestoreService.isSyncEnabled()) return

		set({ isSyncing: true, syncError: null })
		try {
			const promptStore = useSystemPromptStore.getState()
			await firestoreService.syncPrompts(
				promptStore.prompts as unknown as Record<string, unknown>[]
			)
			set({ lastSyncTime: Date.now() })
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to sync prompts'
			set({ syncError: errorMessage })
			console.error('Error syncing prompts:', error)
		} finally {
			set({ isSyncing: false })
		}
	},

	syncAllData: async () => {
		if (!firestoreService.isSyncEnabled()) return

		set({ isSyncing: true, syncError: null })
		try {
			const promptStore = useSystemPromptStore.getState()
			await firestoreService.syncAllData(
				promptStore.prompts as unknown as Record<string, unknown>[]
			)
			set({ lastSyncTime: Date.now() })
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to sync data'
			set({ syncError: errorMessage })
			console.error('Error syncing all data:', error)
		} finally {
			set({ isSyncing: false })
		}
	},

	loadFromCloud: async () => {
		if (!firestoreService.isSyncEnabled()) return

		set({ isSyncing: true, syncError: null })
		try {
			const cloudData = await firestoreService.loadUserData()
			if (cloudData) {
				// You may want to merge or replace local prompts here
				set({ lastSyncTime: Date.now() })
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to load from cloud'
			set({ syncError: errorMessage })
			console.error('Error loading from cloud:', error)
		} finally {
			set({ isSyncing: false })
		}
	},

	clearSyncError: () => {
		set({ syncError: null })
	},
}))

let syncTimeout: NodeJS.Timeout | null = null

const debouncedSync = () => {
	if (syncTimeout) clearTimeout(syncTimeout)
	syncTimeout = setTimeout(() => {
		if (firestoreService.isSyncEnabled()) {
			useSyncStore.getState().syncAllData()
		}
	}, 2000)
}

export const setupAutoSync = () => {
	useSystemPromptStore.subscribe((state) => {
		if (state.prompts.length > 0) {
			debouncedSync()
		}
	})
}
