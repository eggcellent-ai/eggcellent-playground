import { auth } from './firebase'

export interface BackendApiResponse {
	output: string
	usage: {
		promptTokens: number
		completionTokens: number
		totalTokens: number
	}
	cost: number
	credits: number
}

export interface BackendApiError {
	message: string
	status: number
}

export class ApiService {
	private static readonly API_BASE_URL =
		'http://127.0.0.1:5001/eggcellent-playground/us-central1'

	static async callModel(
		modelName: string,
		prompt: string
	): Promise<BackendApiResponse> {
		const user = auth.currentUser

		if (!user) {
			throw new Error('User must be authenticated to use backend API')
		}

		// Get the user's ID token
		const idToken = await user.getIdToken()

		const response = await fetch(`${this.API_BASE_URL}/callModel`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${idToken}`,
			},
			body: JSON.stringify({
				modelName,
				prompt,
			}),
		})

		if (!response.ok) {
			const errorText = await response.text()
			if (response.status === 402) {
				throw new Error('Insufficient credits')
			}
			throw new Error(`Backend API error (${response.status}): ${errorText}`)
		}

		const result = await response.json()

		// Update user's credit balance after successful API call
		// The backend returns the updated credit balance
		if (result.credits !== undefined) {
			const { useAuthStore } = await import('./authStore')
			const authStore = useAuthStore.getState()
			if (authStore.userData) {
				authStore.setUserData({
					...authStore.userData,
					credits: result.credits,
				})
			}
		}

		return result
	}

	// Check if user can use backend API (logged in and has credits)
	static async canUseBackendApi(): Promise<boolean> {
		const user = auth.currentUser
		if (!user) return false

		try {
			// We could make a separate endpoint to check credits, but for now
			// we'll assume if user is authenticated, they can use the API
			// The actual credit check happens on the backend
			return true
		} catch (error) {
			console.error('Error checking backend API availability:', error)
			return false
		}
	}
}
