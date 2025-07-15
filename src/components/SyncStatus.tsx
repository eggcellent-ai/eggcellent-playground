import { useSyncStore } from '../lib/syncStore'
import { useAuthStore } from '../lib/authStore'
import {
	CloudArrowUpIcon,
	CloudArrowDownIcon,
	ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

export default function SyncStatus() {
	const { user } = useAuthStore()
	const { isSyncing, lastSyncTime, syncError } = useSyncStore()

	if (!user) return null

	const formatLastSync = (timestamp: number) => {
		const now = Date.now()
		const diff = now - timestamp
		const minutes = Math.floor(diff / 60000)

		if (minutes < 1) return 'Just now'
		if (minutes < 60) return `${minutes}m ago`

		const hours = Math.floor(minutes / 60)
		if (hours < 24) return `${hours}h ago`

		const days = Math.floor(hours / 24)
		return `${days}d ago`
	}

	return (
		<div className="flex items-center gap-2 text-xs">
			{isSyncing ? (
				<div className="flex items-center gap-1 text-secondary">
					<div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
					<span>Syncing...</span>
				</div>
			) : syncError ? (
				<div className="flex items-center gap-1 text-error">
					<ExclamationTriangleIcon className="w-3 h-3" />
					<span>Sync error</span>
				</div>
			) : lastSyncTime ? (
				<div className="flex items-center gap-1 text-success">
					<CloudArrowUpIcon className="w-3 h-3" />
					<span>{formatLastSync(lastSyncTime)}</span>
				</div>
			) : (
				<div className="flex items-center gap-1 text-secondary">
					<CloudArrowDownIcon className="w-3 h-3" />
					<span>Not synced</span>
				</div>
			)}
		</div>
	)
}
