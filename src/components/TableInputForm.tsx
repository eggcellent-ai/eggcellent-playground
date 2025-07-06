import { useSystemPromptStore } from '../lib/stores'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface TableInputFormProps {
	activePromptId: string
}

export default function TableInputForm({
	activePromptId,
}: TableInputFormProps) {
	const { addTableRow, removeTableRow, prompts, updateTableRowInput } =
		useSystemPromptStore()
	const currentPrompt = prompts.find((p) => p.id === activePromptId)
	const rows = currentPrompt?.inputRows || []

	const handleAddRow = () => {
		addTableRow(activePromptId, '')
	}

	const handleRemoveRow = (rowId: string) => {
		removeTableRow(activePromptId, rowId)
	}

	const handleInputChange = (rowId: string, value: string) => {
		updateTableRowInput(activePromptId, rowId, value)
	}

	return (
		<div className="space-y-4">
			{/* Table Header */}
			<div className="flex justify-between items-center">
				<h3 className="text-sm font-medium text-text-primary">Table Input</h3>
				<button
					onClick={handleAddRow}
					className="px-3 py-1 text-sm bg-primary hover:bg-primary-dark text-white rounded-md flex items-center gap-2 transition-colors"
				>
					<PlusIcon className="w-4 h-4" />
					Add Row
				</button>
			</div>

			{/* Table Body */}
			<div className="space-y-2">
				{rows.map((row) => (
					<div key={row.id} className="flex gap-2 items-start">
						<textarea
							value={row.input}
							onChange={(e) => handleInputChange(row.id, e.target.value)}
							placeholder="Enter input..."
							className="flex-1 p-2 border border-neutral rounded-md text-sm resize-y min-h-[60px] focus:outline-none focus:ring-1 focus:ring-primary"
						/>
						<button
							onClick={() => handleRemoveRow(row.id)}
							className="p-2 text-error hover:text-error-dark transition-colors"
							title="Remove row"
						>
							<TrashIcon className="w-4 h-4" />
						</button>
					</div>
				))}

				{rows.length === 0 && (
					<div className="text-center py-8 text-text-muted">
						<p>No rows added yet. Click "Add Row" to start.</p>
					</div>
				)}
			</div>
		</div>
	)
}
