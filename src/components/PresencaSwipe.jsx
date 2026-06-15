import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const PresencaSwipe = ({ user, treino, equipa, dataSelecionada, onVoltar }) => {
  const [jogadores, setJogadores] = useState([])
  const [indexAtual, setIndexAtual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [equipaId, setEquipaId] = useState(null)
  const [marcando, setMarcando] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const cardRef = useRef(null)

  // Carregar equipa e jogadores
  useEffect(() => {
    const carregar = async () => {
      try {
        // Carregar equipa com UUID correto
        const { data: equipaData, error: erroEquipa } = await supabase
          .from('equipas')
          .select('*')
          .eq('treinador_id', user.id)
          .limit(1)

        if (erroEquipa) throw erroEquipa
        
        const equipaCompleta = equipaData?.[0]
        if (equipaCompleta) {
          setEquipaId(equipaCompleta.id)
          
          // Carregar jogadores
          const { data: jogadoresData, error: erroJogadores } = await supabase
            .from('jogadores')
            .select('*')
            .eq('equipa_id', equipaCompleta.id)
            .order('nome')

          if (erroJogadores) throw erroJogadores
          setJogadores(jogadoresData || [])
        }
      } catch (err) {
        console.error('Erro ao carregar:', err)
        alert(`Erro: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [user.id])

  // Marcar presença
  const marcarPresenca = async (presente) => {
    if (!jogadores[indexAtual] || !equipaId || marcando) return

    setMarcando(true)
    try {
      const jogadorAtual = jogadores[indexAtual]
      const dataFormatada = dataSelecionada.toISOString().split('T')[0]

      // Verificar se já existe
      const { data: existente } = await supabase
        .from('presencas')
        .select('id')
        .eq('jogador_id', jogadorAtual.id)
        .eq('equipa_id', equipaId)
        .eq('data', dataFormatada)
        .limit(1)

      if (existente && existente.length > 0) {
        // Atualizar
        await supabase
          .from('presencas')
          .update({ presente })
          .eq('id', existente[0].id)
      } else {
        // Inserir novo
        await supabase
          .from('presencas')
          .insert({
            jogador_id: jogadorAtual.id,
            equipa_id: equipaId,
            data: dataFormatada,
            presente
          })
      }

      // Próximo jogador
      if (indexAtual < jogadores.length - 1) {
        setIndexAtual(indexAtual + 1)
      } else {
        // Fim!
        alert('Presenças marcadas com sucesso!')
        onVoltar()
      }
    } catch (err) {
      console.error('Erro ao marcar:', err)
      alert(`Erro: ${err.message}`)
    } finally {
      setMarcando(false)
    }
  }

  // Touch eventos para swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    
    const deltaX = touchEndX - touchStartX.current
    const deltaY = touchEndY - touchStartY.current
    
    // Só contar se foi mais horizontal que vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right → Presente
        marcarPresenca(true)
      } else {
        // Swipe left → Ausente
        marcarPresenca(false)
      }
    }
  }

  const formatarData = (data) => {
    return new Intl.DateTimeFormat('pt-PT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">A carregar...</p>
      </div>
    )
  }

  if (jogadores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-600">Sem jogadores</p>
        <button
          onClick={onVoltar}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Voltar
        </button>
      </div>
    )
  }

  const jogadorAtual = jogadores[indexAtual]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onVoltar}
            className="text-2xl text-gray-600 hover:text-gray-900 mb-2"
          >
            ←
          </button>
          <div>
            <p className="text-sm text-gray-600">Marcar Presença</p>
            <p className="text-lg font-semibold text-gray-900">{formatarData(dataSelecionada)} às {treino.hora}</p>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Jogador {indexAtual + 1} de {jogadores.length}</span>
          <span>{Math.round(((indexAtual + 1) / jogadores.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((indexAtual + 1) / jogadores.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-300px)]">
        <div
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 cursor-grab active:cursor-grabbing select-none"
        >
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
              {jogadorAtual.nome.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Nome */}
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
            {jogadorAtual.nome}
          </h2>

          {/* Info */}
          <div className="text-center text-gray-600 mb-8">
            {jogadorAtual.numero && <p className="text-lg">#{jogadorAtual.numero}</p>}
            {jogadorAtual.posicao && <p className="text-sm">{jogadorAtual.posicao}</p>}
          </div>

          {/* Instruções */}
          <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
            <p className="mb-2">👈 Swipe left para <span className="font-semibold text-red-600">Ausente</span></p>
            <p>👉 Swipe right para <span className="font-semibold text-green-600">Presente</span></p>
          </div>
        </div>
      </div>

      {/* Botões (fallback para desktop/tablet) */}
      <div className="max-w-4xl mx-auto px-4 pb-8 flex gap-4">
        <button
          onClick={() => marcarPresenca(false)}
          disabled={marcando}
          className="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition disabled:opacity-50"
        >
          ❌ Ausente
        </button>
        <button
          onClick={() => marcarPresenca(true)}
          disabled={marcando}
          className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          ✅ Presente
        </button>
      </div>
    </div>
  )
}
