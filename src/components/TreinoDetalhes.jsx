import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const TreinoDetalhes = ({ user, treino, equipa, dataSelecionada, onVoltar }) => {
  const [jogadores, setJogadores] = useState([])
  const [presencas, setPresencas] = useState({})
  const [loading, setLoading] = useState(true)
  const [equipaRealId, setEquipaRealId] = useState(null)

  // Carregar jogadores, equipa real e presenças
  useEffect(() => {
    const carregar = async () => {
      try {
        // Carregar equipa completa com ID UUID correto usando user.id
        const { data: equipaData, error: erroEquipa } = await supabase
          .from('equipas')
          .select('*')
          .eq('treinador_id', user.id)
          .limit(1)

        if (erroEquipa) throw erroEquipa
        
        const equipaCompleta = equipaData?.[0]
        if (equipaCompleta) {
          console.log('Equipa carregada com UUID:', equipaCompleta.id)
          setEquipaRealId(equipaCompleta.id)
        } else {
          throw new Error('Equipa não encontrada')
        }

        // Carregar jogadores da equipa
        const { data: jogadoresData, error: erroJogadores } = await supabase
          .from('jogadores')
          .select('*')
          .eq('equipa_id', equipaCompleta.id)
          .order('nome')

        if (erroJogadores) throw erroJogadores
        setJogadores(jogadoresData || [])

        // Carregar presenças do dia
        const dataFormatada = dataSelecionada.toISOString().split('T')[0]
        const { data: presencasData, error: erroPresencas } = await supabase
          .from('presencas')
          .select('*')
          .eq('equipa_id', equipaCompleta.id)
          .eq('data', dataFormatada)

        if (erroPresencas) throw erroPresencas

        // Construir objeto de presenças
        const presencasObj = {}
        presencasData?.forEach(p => {
          presencasObj[p.jogador_id] = p.presente
        })
        setPresencas(presencasObj)
      } catch (err) {
        console.error('Erro ao carregar:', err)
        alert(`Erro ao carregar dados: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [user.id, dataSelecionada])

  // Alternar presença
  const alternarPresenca = (jogadorId) => {
    setPresencas(prev => ({
      ...prev,
      [jogadorId]: !prev[jogadorId]
    }))
  }

  // Guardar presenças
  const guardarPresencas = async () => {
    setLoading(true)
    try {
      const dataFormatada = dataSelecionada.toISOString().split('T')[0]
      console.log('Guardando presenças para:', dataFormatada)
      console.log('Equipa UUID:', equipaRealId)
      console.log('Presenças:', presencas)

      for (const [jogadorId, presente] of Object.entries(presencas)) {
        console.log(`Processando jogador ${jogadorId}: ${presente}`)
        
        const jogadorIdUUID = jogadorId
        
        console.log(`IDs - Jogador: ${jogadorIdUUID}, Equipa UUID: ${equipaRealId}`)
        
        // Verificar se já existe registro
        const { data: existente, error: erroExistente } = await supabase
          .from('presencas')
          .select('id')
          .eq('jogador_id', jogadorIdUUID)
          .eq('equipa_id', equipaRealId)
          .eq('data', dataFormatada)
          .limit(1)

        if (erroExistente) {
          console.error('Erro ao verificar existente:', erroExistente)
          throw erroExistente
        }

        if (existente && existente.length > 0) {
          // Atualizar
          console.log('Atualizando presença...')
          const { error: erroUpdate } = await supabase
            .from('presencas')
            .update({ presente })
            .eq('id', existente[0].id)
          
          if (erroUpdate) {
            console.error('Erro ao atualizar:', erroUpdate)
            throw erroUpdate
          }
        } else {
          // Inserir novo
          console.log('Inserindo nova presença...')
          const dadosInserir = {
            jogador_id: jogadorIdUUID,
            equipa_id: equipaRealId,
            data: dataFormatada,
            presente: Boolean(presente)
          }
          console.log('Dados a inserir:', dadosInserir)
          
          const { error: erroInsert } = await supabase
            .from('presencas')
            .insert([dadosInserir])
          
          if (erroInsert) {
            console.error('Erro ao inserir:', erroInsert)
            throw erroInsert
          }
        }
      }

      console.log('Presenças guardadas com sucesso!')
      alert('Presenças guardadas com sucesso!')
      onVoltar()
    } catch (err) {
      console.error('Erro ao guardar:', err)
      alert(`Erro ao guardar presenças: ${err.message}`)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 md:px-6 max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={onVoltar}
            className="text-2xl text-gray-600 hover:text-gray-900"
          >
            ←
          </button>
          <div className="flex-1">
            <p className="text-sm text-gray-600">Detalhes do Treino</p>
            <p className="text-lg md:text-xl font-semibold text-gray-900">{formatarData(dataSelecionada)} às {treino.hora}</p>
          </div>
        </div>
      </div>

      {/* Info do Treino */}
      <div className="px-4 md:px-6 max-w-4xl mx-auto py-6 space-y-4">
        <div className="bg-white rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border border-gray-200">
          <div>
            <p className="text-xs text-gray-600 uppercase">Equipa</p>
            <p className="font-semibold text-gray-900">{equipa.nome}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase">Escalão</p>
            <p className="font-semibold text-gray-900">{equipa.escalao || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase">Hora</p>
            <p className="font-semibold text-gray-900">{treino.hora}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase">Duração</p>
            <p className="font-semibold text-gray-900">{treino.duracao} min</p>
          </div>
        </div>

        {/* Lista de Jogadores */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Presenças ({jogadores.length})</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {jogadores.length > 0 ? (
              jogadores.map(jogador => (
                <div
                  key={jogador.id}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => alternarPresenca(jogador.id)}
                >
                  {/* Checkbox */}
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      presencas[jogador.id] 
                        ? 'bg-green-600 border-green-600' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {presencas[jogador.id] && (
                        <span className="text-white text-sm font-bold">✓</span>
                      )}
                    </div>
                  </div>

                  {/* Info Jogador */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{jogador.nome}</p>
                    <div className="flex gap-2 text-xs text-gray-600">
                      {jogador.numero && <span>#{jogador.numero}</span>}
                      {jogador.posicao && <span>{jogador.posicao}</span>}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-sm font-semibold">
                    {presencas[jogador.id] ? (
                      <span className="text-green-600">Presente</span>
                    ) : (
                      <span className="text-red-600">Ausente</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                Sem jogadores
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 sticky bottom-4">
          <button
            onClick={onVoltar}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Voltar
          </button>
          <button
            onClick={guardarPresencas}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            Guardar Presenças
          </button>
        </div>
      </div>
    </div>
  )
}
