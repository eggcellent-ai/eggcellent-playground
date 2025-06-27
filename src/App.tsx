import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Home from './pages/Home'
import PromptDetailPage from './pages/PromptDetail'

function App() {
	return (
		<Router>
			<div style={{ backgroundColor: '#fafafa' }} className="min-h-screen">
				<Header />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/prompt/:id" element={<PromptDetailPage />} />
					</Routes>
				</div>
			</div>
		</Router>
	)
}

export default App
