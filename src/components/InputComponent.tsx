import { useState, useEffect } from 'react'
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'

interface UploadedImage {
	id: string
	name: string
	base64: string
	preview: string
}

interface InputComponentProps {
	value: string
	onChange: (value: string, images?: UploadedImage[]) => void
	placeholder?: string
	rows?: number
	disabled?: boolean
	className?: string
	showImageUpload?: boolean
	images?: UploadedImage[]
	onImagesChange?: (images: UploadedImage[]) => void
}

export default function InputComponent({
	value,
	onChange,
	placeholder = 'Enter your input...',
	rows = 3,
	disabled = false,
	className = '',
	showImageUpload = true,
	images = [],
	onImagesChange,
}: InputComponentProps) {
	const [localImages, setLocalImages] = useState<UploadedImage[]>(images)

	// Sync localImages with images prop when it changes
	useEffect(() => {
		setLocalImages(images)
	}, [images])

	// Convert file to base64
	const convertToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.readAsDataURL(file)
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = (error) => reject(error)
		})
	}

	// Handle file upload
	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files) return

		const newImages: UploadedImage[] = []

		for (let i = 0; i < files.length; i++) {
			const file = files[i]

			// Validate file type
			if (!file.type.startsWith('image/')) {
				alert(`${file.name} is not a valid image file`)
				continue
			}

			// Validate file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				alert(`${file.name} is too large. Please select images under 5MB.`)
				continue
			}

			try {
				const base64 = await convertToBase64(file)
				const newImage: UploadedImage = {
					id: `img-${Date.now()}-${i}`,
					name: file.name,
					base64,
					preview: base64,
				}
				newImages.push(newImage)
			} catch (error) {
				console.error('Error converting image:', error)
				alert(`Error processing ${file.name}`)
			}
		}

		const updatedImages = [...localImages, ...newImages]
		setLocalImages(updatedImages)
		onImagesChange?.(updatedImages)
		// Also notify parent via main onChange callback
		onChange(value, updatedImages)

		// Reset input
		e.target.value = ''
	}

	// Remove uploaded image
	const removeImage = (imageId: string) => {
		const updatedImages = localImages.filter((img) => img.id !== imageId)
		setLocalImages(updatedImages)
		onImagesChange?.(updatedImages)
		// Also notify parent via main onChange callback
		onChange(value, updatedImages)
	}

	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value, localImages)
	}

	const inputId = `image-upload-${Math.random().toString(36).substr(2, 9)}`

	return (
		<div className={`space-y-2 ${className}`}>
			{/* Image Preview Area */}
			{showImageUpload && localImages.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs font-semibold text-gray-600">
						Uploaded Images:
					</p>
					<div className="flex flex-wrap gap-2">
						{localImages.map((image) => (
							<div key={image.id} className="relative group">
								<img
									src={image.preview}
									alt={image.name}
									className="w-12 h-12 object-cover rounded-lg border border-gray-300"
								/>
								<button
									onClick={() => removeImage(image.id)}
									className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
									title="Remove image"
								>
									<TrashIcon className="w-2 h-2" />
								</button>
								<p
									className="text-xs text-gray-500 mt-1 truncate w-12"
									title={image.name}
								>
									{image.name}
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Text Input */}
			<textarea
				value={value}
				onChange={handleTextChange}
				placeholder={placeholder}
				rows={rows}
				disabled={disabled}
				className="w-full p-2 border bg-surface-input border-surface-border rounded text-sm resize-none focus:ring-blue-500 focus:border-blue-500"
			/>

			{/* Image Upload Button */}
			{showImageUpload && (
				<div className="flex space-x-2">
					<input
						type="file"
						id={inputId}
						multiple
						accept="image/*"
						onChange={handleImageUpload}
						className="hidden"
						disabled={disabled}
					/>
					<label
						htmlFor={inputId}
						className="flex items-center px-2 py-1 text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs"
					>
						<PhotoIcon className="w-3 h-3 mr-1" />
						Images
					</label>
				</div>
			)}
		</div>
	)
}

export type { UploadedImage }
