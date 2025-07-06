import React from 'react'

interface TabItem<T extends string> {
	id: T
	label: string
}

interface TabGroupProps<T extends string> {
	items: TabItem<T>[]
	activeId: T
	onChange: (id: T) => void
	className?: string
}

export default function TabGroup<T extends string>({
	items,
	activeId,
	onChange,
	className = '',
}: TabGroupProps<T>) {
	return (
		<div className={`flex gap-2 p-2 items-center ${className}`}>
			{items.map((item, index) => (
				<React.Fragment key={item.id}>
					{index > 0 && <span className="text-muted">|</span>}
					<button
						onClick={() => onChange(item.id)}
						className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
							activeId === item.id
								? 'text-primary'
								: 'text-muted hover:text-primary'
						}`}
					>
						{item.label}
					</button>
				</React.Fragment>
			))}
		</div>
	)
}
