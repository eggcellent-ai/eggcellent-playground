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
	placeholder = '',
	rows = 3,
	disabled = false,
	className = '',
}: InputComponentProps) {
	return (
		<textarea
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			rows={rows}
			disabled={disabled}
			className={`w-full p-2 border border-[#f3f3f3] text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
		/>
	)
}
