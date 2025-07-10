interface InputComponentProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	rows?: number
	disabled?: boolean
	className?: string
	id?: string
	name?: string
}

export default function InputComponent({
	value,
	onChange,
	placeholder = '',
	rows = 3,
	disabled = false,
	className = '',
	id,
	name,
}: InputComponentProps) {
	return (
		<textarea
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			rows={rows}
			disabled={disabled}
			id={id}
			name={name}
			className={`w-full p-2 border border-[#f3f3f3] text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
		/>
	)
}
