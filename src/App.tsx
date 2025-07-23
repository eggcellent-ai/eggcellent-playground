import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import Home from './pages/Home'
import PromptDetailPage from './pages/PromptDetail'
import Models from './pages/Models'
import LandingPage from './components/LandingPage'
import { initializeAuth } from './lib/authStore'
import { setupAutoSync } from './lib/syncStore'

function App() {
	const [showLandingPageOnFirst, setShowLandingPageOnFirst] = useState(false)

	useEffect(() => {
		initializeAuth()
		setupAutoSync()

		// Check if user has seen the landing page before
		const hasSeenLandingPage = localStorage.getItem(
			'eggcellent-has-seen-landing'
		)
		if (!hasSeenLandingPage) {
			setShowLandingPageOnFirst(true)
		}
	}, [])

	const handleCloseLandingPage = () => {
		setShowLandingPageOnFirst(false)
		localStorage.setItem('eggcellent-has-seen-landing', 'true')
	}

	return (
		<Router>
			<div className="min-h-screen bg-background">
				<Header />
				<div className="mx-auto px-4 sm:px-6 lg:px-8">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/prompt/:id" element={<PromptDetailPage />} />
						<Route path="/models" element={<Models />} />
					</Routes>
				</div>
			</div>

			{/* Landing Page Modal for first-time visitors */}
			<LandingPage
				isOpen={showLandingPageOnFirst}
				onClose={handleCloseLandingPage}
			/>
		</Router>
	)
}

export default App
