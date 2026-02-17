import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { ResponsiveLayout } from './components/ResponsiveLayout'
import { OfflineIndicator } from './components/OfflineIndicator'
import { LoadingState } from './components/LoadingState'
import { AIAssistant } from './components/AIAssistant'
import './App.css'
import './components/ResponsiveLayout.css'

const Home = lazy(() => import('./pages/Home'))
const Explore = lazy(() => import('./pages/Explore'))
const Upload = lazy(() => import('./pages/Upload'))
const Profile = lazy(() => import('./pages/Profile'))
const RouteDetail = lazy(() => import('./pages/RouteDetail'))

/* eslint-disable react-hooks/set-state-in-effect */

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  // Initialize with current path
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname
    if (path === '/') return '/'
    if (path === '/explore') return '/explore'
    if (path === '/upload') return '/upload'
    if (path === '/profile') return '/profile'
    return '/'
  })
  const [showNav, setShowNav] = useState(() => {
    const path = location.pathname
    // Route detail pages don't show nav
    return path !== '/route/:id' && !path.startsWith('/route/')
  })

  // Compute derived state from location
  const computedActiveTab = useCallback(() => {
    const path = location.pathname
    if (path === '/') return '/'
    if (path === '/explore') return '/explore'
    if (path === '/upload') return '/upload'
    if (path === '/profile') return '/profile'
    return '/'
  }, [location.pathname])

  const computedShowNav = useCallback(() => {
    const path = location.pathname
    return path !== '/route/:id' && !path.startsWith('/route/')
  }, [location.pathname])

  // 根据当前路径决定导航栏的激活状态和是否显示
  useEffect(() => {
    setActiveTab(prev => {
      const newTab = computedActiveTab()
      return newTab !== prev ? newTab : prev
    })
    setShowNav(prev => {
      const newNav = computedShowNav()
      return newNav !== prev ? newNav : prev
    })
  }, [computedActiveTab, computedShowNav])

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key)
    navigate(key)
  }, [navigate])

  return (
    <>
      <OfflineIndicator />
      <ResponsiveLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showNav={showNav}
      >
        <Suspense fallback={<LoadingState fullScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/route/:id" element={<RouteDetail />} />
          </Routes>
        </Suspense>
      </ResponsiveLayout>
      <AIAssistant />
    </>
  )
}

export default App
