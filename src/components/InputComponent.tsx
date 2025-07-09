interface InputComponentProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	rows?: number
	disabled?: boolean
	className?: string
}

export default function InputComponent({
	value,
	onChange,
	placeholder = 'Enter your input...',
	rows = 3,
	disabled = false,
	className = '',
}: InputComponentProps) {
	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value)
	}

	return (
		<div className={`space-y-2 ${className}`}>
			<textarea
				value={value}
				onChange={handleTextChange}
				placeholder={placeholder}
				rows={rows}
				disabled={disabled}
				className="w-full p-2 border bg-surface-input border-neutral text-sm resize-none focus:ring-secondary focus:border-secondary text-primary"
			/>
		</div>
	)
}
