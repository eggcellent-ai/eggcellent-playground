import { useRef, useState, useEffect } from 'react'
import { useAuthStore } from '../lib/authStore'
import { UserIcon } from '@heroicons/react/24/outline'
import SyncStatus from './SyncStatus'

export default function GoogleLogin() {
	const {
		user,
		userData,
		loading,
		error,
		signInWithGoogle,
		logout,
		clearError,
	} = useAuthStore()

	const [dropdownOpen, setDropdownOpen] = useState(false)
	const avatarRef = useRef<HTMLDivElement>(null)

	const handleSignIn = async () => {
		clearError()
		await signInWithGoogle()
	}

	const handleLogout = async () => {
		clearError()
		await logout()
		setDropdownOpen(false)
	}

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				avatarRef.current &&
				!avatarRef.current.contains(event.target as Node)
			) {
				setDropdownOpen(false)
			}
		}
		if (dropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => {
				document.removeEventListener('mousedown', handleClickOutside)
			}
		}
	}, [dropdownOpen])

	if (loading) {
		return (
			<div className="flex items-center gap-2 text-secondary">
				{/* <div className="w-5 h-5 border-1 border-neutral border-t-transparent rounded-full animate-spin"></div> */}
				<span className="hidden sm:inline">Loading...</span>
			</div>
		)
	}

	if (user) {
		return (
			<div className="relative" ref={avatarRef}>
				{/* User Avatar Only */}
				<div
					className="flex items-center gap-2 cursor-pointer"
					onClick={() => setDropdownOpen((open) => !open)}
				>
					{user.photoURL ? (
						<img
							src={user.photoURL}
							alt={user.displayName || 'User'}
							className="w-10 h-10 rounded-full border-2 border-neutral"
						/>
					) : (
						<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
							<UserIcon className="w-5 h-5 text-white" />
						</div>
					)}
				</div>
				{/* Dropdown Menu */}
				{dropdownOpen && (
					<div className="absolute right-0 mt-2 w-56 bg-surface-card border border-neutral rounded-md shadow-lg z-50">
						<div className="px-4 py-2">
							<SyncStatus />
						</div>

						{/* Credits Display */}
						<div className="px-4 py-2 border-t border-neutral">
							<div className="text-xs text-secondary uppercase tracking-wider mb-1">
								Credits
							</div>
							<div className="text-sm font-medium text-primary">
								$
								{userData?.credits !== undefined
									? userData.credits.toFixed(4)
									: '0.0000'}
							</div>
						</div>

						<div className="p-4">
							<div className="text-sm font-medium text-primary">
								{user.displayName || 'User'}
							</div>
							<div className="text-xs text-secondary">{user.email}</div>
						</div>
						<button
							onClick={handleLogout}
							className="w-full text-left px-4 py-2 text-sm text-red-500 hover:text-primary hover:bg-neutral/10 border-t border-neutral"
						>
							Logout
						</button>
					</div>
				)}
			</div>
		)
	}

	return (
		<div className="flex items-center gap-2">
			{error && (
				<div className="text-error text-sm hidden sm:block">{error}</div>
			)}
			<button
				onClick={handleSignIn}
				className="flex items-center gap-2 text-primary px-4 py-2 font-medium transition-colors border border-neutral hover:bg-primary hover:text-white"
			>
				<svg className="w-5 h-5" viewBox="0 0 24 24">
					<path
						fill="currentColor"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="currentColor"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="currentColor"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="currentColor"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				<span className="hidden sm:inline">Sign in with Google</span>
				<span className="sm:hidden">Sign in</span>
			</button>
		</div>
	)
}
