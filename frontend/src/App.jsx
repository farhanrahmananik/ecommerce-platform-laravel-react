import LoadingScreen from './components/common/LoadingScreen.jsx'
import { useAuth } from './hooks/useAuth.js'
import AppRouter from './router/AppRouter.jsx'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return <AppRouter />
}

export default App
