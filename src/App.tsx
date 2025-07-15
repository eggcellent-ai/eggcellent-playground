import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import Home from './pages/Home'
import PromptDetailPage from './pages/PromptDetail'
import Models from './pages/Models'
import { initializeAuth } from './lib/authStore'
import { setupAutoSync } from './lib/syncStore'

function App() {
	useEffect(() => {
		initializeAuth()
		setupAutoSync()
	}, [])

	return (
		<Router>
			<div className="min-h-screen bg-background">
				<Header />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/prompt/:id" element={<PromptDetailPage />} />
						<Route path="/models" element={<Models />} />
					</Routes>
				</div>
			</div>
		</Router>
	)
}

export default App
