import { useState } from 'react'
import { supabase } from '../lib/supabase'

const DIAS_SEMANA = [
  { id: 0, nome: 'Segunda' },
  { id: 1, nome: 'Terça' },
  { id: 2, nome: 'Quarta' },
  { id: 3, nome: 'Quinta' },
  { id: 4, nome: 'Sexta' },
  { id: 5, nome: 'Sábado' },
  { id: 6, nome: 'Domingo' },
]

export const CreateTeam = ({ user, onTeamCreated }) => {
  const [passo, setPasso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Passo 1: Info da equipa
  const [nomeEquipa, setNomeEquipa] = useState('')
  const [escalao, setEscalao] = useState('')
  const [diasTreino, setDiasTreino] = useState([])

  // Passo 2: Jogadores
  const [jogadores, setJogadores] = useState([])
  const [nomeJogador, setNomeJogador] = useState('')
  const [numeroJogador, setNumeroJogador] = useState('')
  const [posicaoJogador, setPosicaoJogador] = useState('')

  const [equipaId, setEquipaId] = useState(null)

  // ===== PASSO 1: CRIAR EQUIPA =====

  const handleAddDiaTreino = () => {
    setDiasTreino([...diasTreino, { dia: 0, hora: '19:00' }])
  }

  const handleRemoveDiaTreino = (index) => {
    setDiasTreino(diasTreino.filter((_, i) => i !== index))
  }

  const handleChangeDiaTreino = (index, campo, valor) => {
    const novosDias = [...diasTreino]
    novosDias[index][campo] = valor
    setDiasTreino(novosDias)
  }

  const validatePasso1 = () => {
    setError('')
    if (!nomeEquipa.trim()) {
      setError('Nome da equipa é obrigatório')
      return false
    }
    if (diasTreino.length === 0) {
      setError('Adiciona pelo menos um dia de treino')
      return false
    }
    return true
  }

  const handleProximoPasso = async () => {
    if (!validatePasso1()) return

    setLoading(true)
    setError('')

    try {
      // Criar equipa
      const { data: equipa, error: erroEquipa } = await supabase
        .from('equipas')
        .insert({
          treinador_id: user.id,
          nome: nomeEquipa,
          escalao: escalao,
        })
        .select()

      if (erroEquipa) throw erroEquipa

      const novaEquipaId = equipa[0].id
      setEquipaId(novaEquipaId)

      // Criar dias de treino
      const diasParaInserir = diasTreino.map(d => ({
        equipa_id: novaEquipaId,
        dia_semana: d.dia,
        hora: d.hora,
      }))

      const { error: erroDias } = await supabase
        .from('dias_treino')
        .insert(diasParaInserir)

      if (erroDias) throw erroDias

      setPasso(2)
    } catch (err) {
      setError(err.message || 'Erro ao criar equipa')
    } finally {
      setLoading(false)
    }
  }

  // ===== PASSO 2: ADICIONAR JOGADORES =====

  const handleAddJogador = () => {
    if (!nomeJogador.trim()) {
      setError('Nome do jogador é obrigatório')
      return
    }

    const novoJogador = {
      id: Date.now(),
      nome: nomeJogador,
      numero: numeroJogador ? parseInt(numeroJogador) : null,
      posicao: posicaoJogador,
    }

    setJogadores([...jogadores, novoJogador])
    setNomeJogador('')
    setNumeroJogador('')
    setPosicaoJogador('')
    setError('')
  }

  const handleRemoveJogador = (id) => {
    setJogadores(jogadores.filter(j => j.id !== id))
  }

  const handleCriarEquipa = async () => {
    setError('')

    // Validar mínimo 1 jogador
    if (jogadores.length === 0) {
      setError('A equipa precisa de ter no mínimo 1 jogador')
      return
    }

    setLoading(true)

    try {
      // Inserir jogadores
      const jogadoresParaInserir = jogadores.map(j => ({
        equipa_id: equipaId,
        nome: j.nome,
        numero: j.numero && j.numero.trim() !== '' ? parseInt(j.numero) : null,
        posicao: j.posicao && j.posicao.trim() !== '' ? j.posicao : null,
      }))

      const { error: erroJogadores } = await supabase
        .from('jogadores')
        .insert(jogadoresParaInserir)

      if (erroJogadores) throw erroJogadores

      // Sucesso!
      onTeamCreated()
    } catch (err) {
      setError(err.message || 'Erro ao criar equipa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Equipa</h1>
          <p className="text-gray-500">Passo {passo} de 2</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* ===== PASSO 1 ===== */}
        {passo === 1 && (
          <div className="space-y-6">
            {/* Nome Equipa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Equipa *
              </label>
              <input
                type="text"
                value={nomeEquipa}
                onChange={(e) => setNomeEquipa(e.target.value)}
                placeholder="Ex: Sporting"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Escalão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalão (opcional)
              </label>
              <select
                value={escalao}
                onChange={(e) => setEscalao(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleciona um escalão</option>
                <option value="Sub-5">Sub-5</option>
                <option value="Sub-6">Sub-6</option>
                <option value="Sub-7">Sub-7</option>
                <option value="Sub-8">Sub-8</option>
                <option value="Sub-9">Sub-9</option>
                <option value="Sub-10">Sub-10</option>
                <option value="Sub-11">Sub-11</option>
                <option value="Sub-12">Sub-12</option>
                <option value="Sub-13">Sub-13</option>
                <option value="Sub-14">Sub-14</option>
                <option value="Sub-15">Sub-15</option>
                <option value="Sub-16">Sub-16</option>
                <option value="Sub-17">Sub-17</option>
                <option value="Sub-18">Sub-18</option>
                <option value="Sub-19">Sub-19</option>
                <option value="Sénior">Sénior</option>
                <option value="Outro">Outro (especificar)</option>
              </select>
              
              {escalao === "Outro" && (
                <input
                  type="text"
                  placeholder="Escreve o escalão personalizado"
                  onChange={(e) => setEscalao(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
              )}
            </div>

            {/* Dias de Treino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dias de Treino *
              </label>

              {/* Seleção de Dias */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Seleciona os dias:</p>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        const jaExiste = diasTreino.find(dia => dia.dia === d.id)
                        if (jaExiste) {
                          setDiasTreino(diasTreino.filter(dia => dia.dia !== d.id))
                        } else {
                          setDiasTreino([...diasTreino, { dia: d.id, hora: '19:00' }])
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        diasTreino.find(dia => dia.dia === d.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {d.nome.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horários dos Dias Selecionados */}
              {diasTreino.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-2">Define as horas e duração:</p>
                  {diasTreino.map((dia, index) => {
                    const [horas, minutos] = dia.hora.split(':')
                    return (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-24 text-sm font-medium text-gray-700">
                            {DIAS_SEMANA[dia.dia].nome}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 block mb-1">Hora</label>
                            <div className="flex gap-1 items-center">
                              <select
                                value={horas}
                                onChange={(e) => {
                                  const novaHora = `${e.target.value}:${minutos}`
                                  handleChangeDiaTreino(index, 'hora', novaHora)
                                }}
                                className="w-14 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                {Array.from({ length: 24 }, (_, i) => (
                                  <option key={i} value={String(i).padStart(2, '0')}>
                                    {String(i).padStart(2, '0')}
                                  </option>
                                ))}
                              </select>
                              <span className="text-gray-600">:</span>
                              <select
                                value={minutos}
                                onChange={(e) => {
                                  const novaHora = `${horas}:${e.target.value}`
                                  handleChangeDiaTreino(index, 'hora', novaHora)
                                }}
                                className="w-14 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                <option value="00">00</option>
                                <option value="15">15</option>
                                <option value="30">30</option>
                                <option value="45">45</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 block mb-1">Duração (min)</label>
                            <input
                              type="number"
                              value={dia.duracao || 60}
                              onChange={(e) =>
                                handleChangeDiaTreino(index, 'duracao', parseInt(e.target.value))
                              }
                              placeholder="Ex: 60"
                              min="15"
                              step="15"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Botão Próximo */}
            <button
              onClick={handleProximoPasso}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg"
            >
              {loading ? 'Criando...' : 'Próximo Passo'}
            </button>
          </div>
        )}

        {/* ===== PASSO 2 ===== */}
        {passo === 2 && (
          <div className="space-y-6">
            {/* Info da Equipa */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">{nomeEquipa}</h3>
              <p className="text-sm text-gray-600">{escalao}</p>
            </div>

            {/* Adicionar Jogadores */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Adicionar Jogadores
              </h3>

              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={nomeJogador}
                  onChange={(e) => setNomeJogador(e.target.value)}
                  placeholder="Nome do Jogador"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  value={numeroJogador}
                  onChange={(e) => setNumeroJogador(e.target.value)}
                  placeholder="Número (opcional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="text"
                  value={posicaoJogador}
                  onChange={(e) => setPosicaoJogador(e.target.value)}
                  placeholder="Posição (opcional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={handleAddJogador}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  + Adicionar Jogador
                </button>
              </div>

              {/* Lista de Jogadores */}
              {jogadores.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Jogadores ({jogadores.length})
                  </h4>
                  <div className="space-y-2">
                    {jogadores.map(jogador => (
                      <div
                        key={jogador.id}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            #{jogador.numero} {jogador.nome}
                          </p>
                          {jogador.posicao && (
                            <p className="text-sm text-gray-500">{jogador.posicao}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveJogador(jogador.id)}
                          className="px-3 py-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={() => setPasso(1)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Voltar
              </button>
              <button
                onClick={handleCriarEquipa}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg"
              >
                {loading ? 'Criando...' : 'Criar Equipa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
