import type { ReactNode } from 'react'
import { useAuthStore } from '../lib/authStore'

interface ProtectedRouteProps {
	children: ReactNode
	requireAuth?: boolean
	fallback?: ReactNode
}

export default function ProtectedRoute({
	children,
	requireAuth = false,
	fallback,
}: ProtectedRouteProps) {
	const { user, loading } = useAuthStore()

	// Show loading spinner while checking auth state
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
			</div>
		)
	}

	// If authentication is required but user is not logged in
	if (requireAuth && !user) {
		return (
			fallback || (
				<div className="flex flex-col items-center justify-center min-h-screen gap-4">
					<div className="text-center">
						<h2 className="text-2xl font-bold text-primary mb-2">
							Authentication Required
						</h2>
						<p className="text-secondary mb-4">
							Please sign in to access this feature.
						</p>
					</div>
				</div>
			)
		)
	}

	return <>{children}</>
}
