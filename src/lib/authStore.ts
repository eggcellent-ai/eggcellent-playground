import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
	signInWithPopup,
	signOut,
	onAuthStateChanged,
	type User,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { useSyncStore } from './syncStore'
import { firestoreService } from './firestore'

interface AuthState {
	user: User | null
	loading: boolean
	error: string | null
	signInWithGoogle: () => Promise<void>
	logout: () => Promise<void>
	setUser: (user: User | null) => void
	setLoading: (loading: boolean) => void
	setError: (error: string | null) => void
	clearError: () => void
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			loading: true,
			error: null,

			signInWithGoogle: async () => {
				try {
					set({ loading: true, error: null })
					const result = await signInWithPopup(auth, googleProvider)
					set({ user: result.user, loading: false })
					
							// Enable sync and sync user profile to Firebase
			useSyncStore.getState().enableSync(result.user.uid)
			await firestoreService.syncUserProfile({
				uid: result.user.uid,
				displayName: result.user.displayName,
				email: result.user.email,
				photoURL: result.user.photoURL,
			})
			await useSyncStore.getState().loadFromCloud()
				} catch (error) {
					console.error('Google sign-in error:', error)
					const errorMessage =
						error instanceof Error ? error.message : 'Sign-in failed'
					set({ error: errorMessage, loading: false })
				}
			},

			logout: async () => {
				try {
					set({ loading: true, error: null })
					await signOut(auth)
					set({ user: null, loading: false })
					useSyncStore.getState().disableSync()
				} catch (error) {
					console.error('Logout error:', error)
					const errorMessage =
						error instanceof Error ? error.message : 'Logout failed'
					set({ error: errorMessage, loading: false })
				}
			},

			setUser: (user: User | null) => set({ user }),
			setLoading: (loading: boolean) => set({ loading }),
			setError: (error: string | null) => set({ error }),
			clearError: () => set({ error: null }),
		}),
		{
			name: 'auth-storage',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ user: state.user }),
		}
	)
)

export const initializeAuth = () => {
	onAuthStateChanged(auth, async (user) => {
		useAuthStore.getState().setUser(user)
		useAuthStore.getState().setLoading(false)
		if (user) {
			useSyncStore.getState().enableSync(user.uid)
			// Sync user profile on auth state change (e.g., page refresh)
			try {
				await firestoreService.syncUserProfile({
					uid: user.uid,
					displayName: user.displayName,
					email: user.email,
					photoURL: user.photoURL,
				})
			} catch (error) {
				console.error('Error syncing user profile on auth change:', error)
			}
			await useSyncStore.getState().loadFromCloud()
		} else {
			useSyncStore.getState().disableSync()
		}
	})
}
