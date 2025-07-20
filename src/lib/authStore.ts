import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
	signInWithPopup,
	signOut,
	onAuthStateChanged,
	type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, googleProvider } from './firebase'
import { useSyncStore } from './syncStore'
import { firestoreService, db } from './firestore'
import type { UserData } from './types'

// Helper function to convert Firebase User to UserData for Firestore
const userToUserData = (user: User): UserData => ({
	userId: user.uid,
	displayName: user.displayName,
	email: user.email,
	photoURL: user.photoURL,
})

interface AuthState {
	user: User | null
	userData: UserData | null
	loading: boolean
	error: string | null
	signInWithGoogle: () => Promise<void>
	logout: () => Promise<void>
	setUser: (user: User | null) => void
	setUserData: (userData: UserData | null) => void
	setLoading: (loading: boolean) => void
	setError: (error: string | null) => void
	clearError: () => void
	loadUserData: () => Promise<void>
	hasCredits: () => boolean
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			userData: null,
			loading: true,
			error: null,

			signInWithGoogle: async () => {
				try {
					set({ loading: true, error: null })
					const result = await signInWithPopup(auth, googleProvider)
					set({ user: result.user, loading: false })

					// Enable sync and sync user profile to Firebase
					useSyncStore.getState().enableSync(result.user.uid)
					await firestoreService.syncUserProfile(userToUserData(result.user))
					
					// Load user data including credits
					await get().loadUserData()
					
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
					set({ user: null, userData: null, loading: false })
					useSyncStore.getState().disableSync()
				} catch (error) {
					console.error('Logout error:', error)
					const errorMessage =
						error instanceof Error ? error.message : 'Logout failed'
					set({ error: errorMessage, loading: false })
				}
			},

			setUser: (user: User | null) => set({ user }),
			setUserData: (userData: UserData | null) => set({ userData }),
			setLoading: (loading: boolean) => set({ loading }),
			setError: (error: string | null) => set({ error }),
			clearError: () => set({ error: null }),
			
			loadUserData: async () => {
				const { user } = get()
				if (!user) {
					set({ userData: null })
					return
				}

				try {
					const userDocRef = doc(db, 'users', user.uid)
					const userDoc = await getDoc(userDocRef)
					
					if (userDoc.exists()) {
						const userData = userDoc.data() as UserData
						set({ userData })
					} else {
						set({ userData: null })
					}
				} catch (error) {
					console.error('Error loading user data:', error)
					set({ userData: null })
				}
			},

			hasCredits: () => {
				const { userData } = get()
				return userData ? (userData.credits || 0) > 0 : false
			},
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
		const authStore = useAuthStore.getState()
		authStore.setUser(user)
		authStore.setLoading(false)
		
		if (user) {
			useSyncStore.getState().enableSync(user.uid)
			// Sync user profile on auth state change (e.g., page refresh)
			try {
				await firestoreService.syncUserProfile(userToUserData(user))
				// Load user data including credits
				await authStore.loadUserData()
			} catch (error) {
				console.error('Error syncing user profile on auth change:', error)
			}
			await useSyncStore.getState().loadFromCloud()
		} else {
			authStore.setUserData(null)
			useSyncStore.getState().disableSync()
		}
	})
}
