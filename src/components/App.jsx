import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import { Login } from './components/Login'
import { CreateTeam } from './components/CreateTeam'
import { Dashboard } from './components/Dashboard'
import { TreinoDetalhes } from './components/TreinoDetalhes'

function App() {
  const { user, loading, logout } = useAuth()
  const [hasTeam, setHasTeam] = useState(null)
  const [checkingTeam, setCheckingTeam] = useState(true)
  const [treinoSelecionado, setTreinoSelecionado] = useState(null)
  const [dataSelecionada, setDataSelecionada] = useState(null)
  const [equipaAtual, setEquipaAtual] = useState(null)

  useEffect(() => {
    const checkTeam = async () => {
      if (!user) {
        setCheckingTeam(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('equipas')
          .select('id')
          .eq('treinador_id', user.id)
          .limit(1)

        if (error) throw error

        setHasTeam(data && data.length > 0)
      } catch (err) {
        console.error('Erro ao verificar equipa:', err)
        setHasTeam(false)
      } finally {
        setCheckingTeam(false)
      }
    }

    checkTeam()
  }, [user])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    }
  }

  if (loading || checkingTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  // If not logged in, show Login
  if (!user) {
    return <Login onLoginSuccess={() => {}} />
  }

  // If logged in but no team, show Create Team
  if (!hasTeam) {
    return (
      <CreateTeam 
        user={user} 
        onTeamCreated={() => setHasTeam(true)}
      />
    )
  }

  // If logged in with team, show Dashboard or TreinoDetalhes
  if (treinoSelecionado) {
    return (
      <TreinoDetalhes
        user={user}
        treino={treinoSelecionado}
        equipa={equipaAtual}
        dataSelecionada={dataSelecionada}
        onVoltar={() => setTreinoSelecionado(null)}
      />
    )
  }

  return (
    <Dashboard 
      user={user} 
      onLogout={handleLogout}
      onTreinoSelecionado={(treino, data, equipa) => {
        setTreinoSelecionado(treino)
        setDataSelecionada(data)
        setEquipaAtual(equipa)
      }}
    />
  )
}

export default App
