import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
	CodeBracketIcon,
	BeakerIcon,
	CpuChipIcon,
	TableCellsIcon,
	DocumentTextIcon,
	UserGroupIcon,
} from '@heroicons/react/24/outline'
import OpenAILogo from '@/assets/logos/openai.svg'
import AnthropicLogo from '@/assets/logos/anthropic.svg'
import GoogleLogo from '@/assets/logos/google.svg'
import GrokLogo from '@/assets/logos/grok.svg'

interface LandingPageProps {
	isOpen: boolean
	onClose: () => void
}

export default function LandingPage({ isOpen, onClose }: LandingPageProps) {
	const [animateIn, setAnimateIn] = useState(false)

	useEffect(() => {
		if (isOpen) {
			setAnimateIn(true)
		}
	}, [isOpen])

	// Disable body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			// Save current scroll position
			const scrollY = window.scrollY
			// Disable scroll
			document.body.style.overflow = 'hidden'
			document.body.style.position = 'fixed'
			document.body.style.top = `-${scrollY}px`
			document.body.style.width = '100%'

			return () => {
				// Re-enable scroll and restore position
				document.body.style.overflow = ''
				document.body.style.position = ''
				document.body.style.top = ''
				document.body.style.width = ''
				window.scrollTo(0, scrollY)
			}
		}
	}, [isOpen])

	// Handle Esc key to close modal
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown)
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen, onClose])

	if (!isOpen) return null

	const features = [
		{
			icon: TableCellsIcon,
			title: 'Table-based Interface',
			description:
				'Organize prompts and inputs like Notion/Excel for clear testing workflows',
		},
		{
			icon: CpuChipIcon,
			title: 'Multi-Model Comparison',
			description: 'Run GPT-4, Claude, Gemini, and more models simultaneously',
		},
		{
			icon: BeakerIcon,
			title: 'Batch Testing',
			description:
				'Test multiple prompts and variations at once to find the best approach',
		},
		{
			icon: DocumentTextIcon,
			title: 'Version Control',
			description:
				'Track prompt changes and compare different versions side by side',
		},
		{
			icon: CodeBracketIcon,
			title: 'JSON Schema Validation',
			description: 'Ensure structured outputs match your expected format',
		},
		{
			icon: UserGroupIcon,
			title: 'Local-First',
			description:
				'Your data stays private - works offline with optional cloud sync',
		},
	]

	return (
		<div
			className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
			onClick={onClose}
		>
			<div
				className={`relative bg-surface-card shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto transition-all duration-300 ${
					animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-neutral-light rounded-full transition-colors z-20 bg-surface-card shadow-md"
					title="Close (Esc)"
				>
					<XMarkIcon className="w-6 h-6 text-secondary" />
				</button>

				{/* Hero Section */}
				<div className="px-8 pt-16 pb-16 text-center bg-gradient-to-br from-primary/10 to-blue-50 gap-6 flex flex-col items-center">
					<div className="mb-8">
						<img
							src="/image.png"
							alt="Eggcellent AI Logo"
							className="mx-auto mb-6"
							style={{ maxWidth: '300px', height: 'auto' }}
						/>
					</div>
					<h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
						Find your best model
					</h1>
					<p className="text-xl md:text-2xl text-secondary mb-8 max-w-3xl mx-auto">
						Compare AI models, manage prompts, and validate outputs — all in one
						place.
					</p>
					<button
						onClick={onClose}
						className="bg-primary hover:bg-primary-dark text-white px-8 py-3 border border-primary font-semibold text-lg transition-colors"
					>
						Start with your prompt →
					</button>
				</div>

				{/* Features Section */}
				<div className="px-8 py-16">
					<h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-12">
						Everything you need to perfect your prompts
					</h2>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						{features.map((feature, index) => (
							<div key={index} className="text-center p-6">
								<div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
									<feature.icon className="w-8 h-8 text-primary" />
								</div>
								<h3 className="text-xl font-semibold text-primary mb-3">
									{feature.title}
								</h3>
								<p className="text-secondary leading-relaxed">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>

				{/* Model Comparison Demo */}
				<div className="px-8 py-16 bg-[#f4f4f4]">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
							Compare models side-by-side
						</h2>
						<p className="text-xl text-secondary max-w-2xl mx-auto">
							See how different AI models respond to your prompts and choose the
							best one for your use case.
						</p>
					</div>

					<div className="max-w-4xl mx-auto">
						{/* Input Prompt Box */}
						<div className="font-semibold text-primary pb-2">System Prompt</div>

						<div className="mb-6 p-4 border border-neutral gap-2">
							<span className="text-secondary">
								Summarize the following article in 3 bullet points: "AI is
								transforming the world by enabling new possibilities in every
								industry..."
							</span>
						</div>
						<div className="font-semibold text-primary pb-2">
							Response with multiple models
						</div>

						<div>
							<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
								<div className="border border-neutral p-4 bg-surface-card">
									<div className="flex items-center mb-3">
										<img
											src={OpenAILogo}
											alt="GPT-4 Logo"
											className="w-6 h-6 mr-2"
										/>
										<span className="font-semibold">OpenAI</span>
									</div>
									<p className="text-sm text-secondary">
										"Here's a comprehensive solution that considers multiple
										perspectives..."
									</p>
								</div>
								<div className="border border-neutral p-4 bg-surface-card">
									<div className="flex items-center mb-3">
										<img
											src={AnthropicLogo}
											alt="Claude Logo"
											className="w-6 h-6 mr-2"
										/>
										<span className="font-semibold">Claude</span>
									</div>
									<p className="text-sm text-secondary">
										"I'll approach this thoughtfully by breaking down the key
										components..."
									</p>
								</div>
								<div className="border border-neutral p-4 bg-surface-card">
									<div className="flex items-center mb-3">
										<img
											src={GoogleLogo}
											alt="Gemini Logo"
											className="w-6 h-6 mr-2"
										/>
										<span className="font-semibold">Gemini</span>
									</div>
									<p className="text-sm text-secondary">
										"Let me analyze this step by step to provide an optimal
										response..."
									</p>
								</div>
								<div className="border border-neutral p-4 bg-surface-card">
									<div className="flex items-center mb-3">
										<img
											src={GrokLogo}
											alt="Grok Logo"
											className="w-6 h-6 mr-2"
										/>
										<span className="font-semibold">Grok</span>
									</div>
									<p className="text-sm text-secondary">
										"Let me tackle this with a fresh perspective and some humor
										mixed in..."
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* No API Keys Required Section */}
				<div className="px-8 py-16 bg-green-50">
					<h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-6">
						No API Keys Required
					</h2>
					<p className="text-xl text-secondary text-center mb-6 max-w-2xl mx-auto">
						You can try top models like Claude and Gemini without the hassle of
						signing up for each provider.
					</p>

					<p className="text-lg text-primary font-semibold text-center mt-6">
						With Eggcellent, you can skip all that—just start testing instantly.
					</p>
				</div>
			</div>
		</div>
	)
}
