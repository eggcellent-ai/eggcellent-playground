import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
	CodeBracketIcon,
	BeakerIcon,
	CpuChipIcon,
	TableCellsIcon,
	DocumentTextIcon,
	UserGroupIcon,
	AcademicCapIcon,
	RocketLaunchIcon,
} from '@heroicons/react/24/outline'

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

	const useCases = [
		{
			icon: RocketLaunchIcon,
			title: 'AI Startups',
			description:
				'Quickly prototype and optimize AI features before production',
		},
		{
			icon: CodeBracketIcon,
			title: 'Dev Teams',
			description:
				'Debug prompts, test edge cases, and ensure consistent AI behavior',
		},
		{
			icon: AcademicCapIcon,
			title: 'Researchers',
			description:
				'Compare model capabilities and analyze AI system performance',
		},
	]

	const steps = [
		{
			number: '01',
			title: 'Create Prompts',
			description:
				'Add your system prompts and test inputs in a clean table interface',
		},
		{
			number: '02',
			title: 'Select Models',
			description:
				'Choose from GPT-4, Claude, Gemini, and other leading AI models',
		},
		{
			number: '03',
			title: 'Compare Results',
			description:
				'See responses side-by-side to find the best model for your use case',
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
						Test, compare, and debug AI prompts with a powerful local-first tool
						designed for developers, AI builders, and startup founders.
					</p>
					<button
						onClick={onClose}
						className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
					>
						Try it now →
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
				<div className="px-8 py-16 bg-neutral-light">
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
						<div className="bg-surface-card rounded-xl p-6 shadow-lg">
							<div className="grid md:grid-cols-3 gap-4">
								<div className="border border-neutral rounded-lg p-4">
									<div className="flex items-center mb-3">
										<div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
										<span className="font-semibold">GPT-4</span>
									</div>
									<p className="text-sm text-secondary">
										"Here's a comprehensive solution that considers multiple
										perspectives..."
									</p>
								</div>
								<div className="border border-neutral rounded-lg p-4">
									<div className="flex items-center mb-3">
										<div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
										<span className="font-semibold">Claude</span>
									</div>
									<p className="text-sm text-secondary">
										"I'll approach this thoughtfully by breaking down the key
										components..."
									</p>
								</div>
								<div className="border border-neutral rounded-lg p-4">
									<div className="flex items-center mb-3">
										<div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
										<span className="font-semibold">Gemini</span>
									</div>
									<p className="text-sm text-secondary">
										"Let me analyze this step by step to provide an optimal
										response..."
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* How it Works */}
				<div className="px-8 py-16">
					<h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-12">
						How it works
					</h2>
					<div className="max-w-4xl mx-auto">
						<div className="grid md:grid-cols-3 gap-8">
							{steps.map((step, index) => (
								<div key={index} className="text-center">
									<div className="w-16 h-16 mx-auto mb-6 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-xl">
										{step.number}
									</div>
									<h3 className="text-xl font-semibold text-primary mb-3">
										{step.title}
									</h3>
									<p className="text-secondary leading-relaxed">
										{step.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Use Cases */}
				<div className="px-8 py-16 bg-neutral-light">
					<h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-12">
						Perfect for
					</h2>
					<div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
						{useCases.map((useCase, index) => (
							<div
								key={index}
								className="bg-surface-card rounded-xl p-8 text-center shadow-sm"
							>
								<div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
									<useCase.icon className="w-8 h-8 text-primary" />
								</div>
								<h3 className="text-xl font-semibold text-primary mb-3">
									{useCase.title}
								</h3>
								<p className="text-secondary leading-relaxed">
									{useCase.description}
								</p>
							</div>
						))}
					</div>
				</div>

				{/* Call to Action */}
				<div className="px-8 py-16 text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
						Ready to improve your AI prompts?
					</h2>
					<p className="text-xl text-secondary mb-8 max-w-2xl mx-auto">
						Start testing and optimizing your prompts today with our powerful,
						local-first tool.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<button
							onClick={onClose}
							className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
						>
							Start Using Eggcellent
						</button>
						<a
							href="https://github.com/eggcellent-ai/eggcellent-playground"
							target="_blank"
							rel="noopener noreferrer"
							className="border border-neutral hover:bg-neutral-light px-8 py-4 rounded-xl font-semibold text-lg transition-colors text-primary"
						>
							View on GitHub
						</a>
					</div>
				</div>
			</div>
		</div>
	)
}
