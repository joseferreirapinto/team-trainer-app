import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DIAS_SEMANA_NOMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// Converter getDay() (0=domingo) para sistema onde segunda=0
const obterDiaSemana = (data) => (data.getDay() + 6) % 7

export const Dashboard = ({ user, onLogout, onTreinoSelecionado, onPresencaSwipe }) => {
  const [aba, setAba] = useState('semana')
  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  const [equipa, setEquipa] = useState(null)
  const [diasTreino, setDiasTreino] = useState([])
  const [loading, setLoading] = useState(true)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [jogadores, setJogadores] = useState([])

  const DIAS_SEMANA_IDS = {
    0: 'Segunda', 1: 'Terça', 2: 'Quarta', 3: 'Quinta',
    4: 'Sexta', 5: 'Sábado', 6: 'Domingo',
  }

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { data: equipaData, error: erroEquipa } = await supabase
          .from('equipas').select('*').eq('treinador_id', user.id).limit(1)
        if (erroEquipa) throw erroEquipa
        if (equipaData && equipaData.length > 0) {
          const equipaAtual = equipaData[0]
          setEquipa(equipaAtual)
          
          // Carregar jogadores
          const { data: jogadoresData, error: erroJogadores } = await supabase
            .from('jogadores').select('*').eq('equipa_id', equipaAtual.id)
          if (erroJogadores) throw erroJogadores
          setJogadores(jogadoresData || [])
          
          const { data: diasData, error: erroDias } = await supabase
            .from('dias_treino').select('*').eq('equipa_id', equipaAtual.id)
          if (erroDias) throw erroDias
          setDiasTreino(diasData || [])
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      } finally {
        setLoading(false)
      }
    }
    carregarDados()
  }, [user.id])

  const temTreinoNoDia = (data) => {
    const diaSemana = obterDiaSemana(data)
    return diasTreino.some(d => d.dia_semana === diaSemana)
  }

  const formatarData = (data) => {
    return `${String(data.getDate()).padStart(2, '0')} ${MESES[data.getMonth()]}`
  }

  // ===== VISTA DIA =====
  
  const obterNumerTreinoGlobal = (treino, dataSelecionada, equipa, todosTreinos = diasTreino) => {
    const origem = new Date(equipa.criado_em)
    
    // Data real = data selecionada
    const dataRealTreino = new Date(dataSelecionada)
    
    console.log('===DEBUG===')
    console.log('Treino:', treino.dia_semana, 'ID:', treino.id)
    console.log('Data real:', dataRealTreino.toISOString().split('T')[0])
    console.log('Origem:', origem.toISOString().split('T')[0])
    
    // Contar treinos desde origem até data real
    let numero = 0
    const treinosOrdenados = [...todosTreinos].sort((a, b) => a.dia_semana - b.dia_semana)
    
    console.log('Treinos ordenados:', treinosOrdenados.map(t => ({ dia: t.dia_semana, id: t.id })))
    
    // Iterar por cada dia desde origem até data real
    let data = new Date(origem)
    while (data <= dataRealTreino) {
      const diaSemanaAtual = (data.getDay() + 6) % 7
      const treinoHoje = treinosOrdenados.find(t => t.dia_semana === diaSemanaAtual)
      
      console.log('Data:', data.toISOString().split('T')[0], 'DiaSemana:', diaSemanaAtual, 'Treino?:', treinoHoje ? 'SIM' : 'NÃO')
      
      if (treinoHoje) {
        numero++
        console.log('  Contando... numero=', numero, 'ID deste:', treinoHoje.id, 'ID procurado:', treino.id)
        
        if (data.toDateString() === dataRealTreino.toDateString() && treinoHoje.id === treino.id) {
          console.log('  ENCONTRADO! Retornando:', numero)
          return numero
        }
      }
      
      data.setDate(data.getDate() + 1)
    }
    
    console.log('Saiu do loop. numero=', numero)
    return Math.max(1, numero)
  }

  const renderizarVistaDia = () => {
    const diaSemana = obterDiaSemana(dataSelecionada)
    const treinosDoDia = diasTreino.filter(d => d.dia_semana === diaSemana && podeExibirTreinoNaData(dataSelecionada))
    const temTreino = treinosDoDia.length > 0

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white p-3 md:p-4 rounded-lg border border-gray-200 gap-2">
          <button onClick={() => { const d = new Date(dataSelecionada); d.setDate(d.getDate() - 1); setDataSelecionada(d) }} className="px-2 md:px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">←</button>
          <div className="text-center flex-1">
            <p className="text-xs md:text-sm text-gray-600">{DIAS_SEMANA_NOMES[diaSemana]}</p>
            <p className="text-base md:text-lg font-semibold text-gray-900">{formatarData(dataSelecionada)}</p>
          </div>
          <button onClick={() => { const d = new Date(dataSelecionada); d.setDate(d.getDate() + 1); setDataSelecionada(d) }} className="px-2 md:px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">→</button>
        </div>

        <div className="w-full h-48 md:h-64 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-white">{String(dataSelecionada.getDate()).padStart(2, '0')}</p>
            <p className="text-blue-100 text-xs md:text-sm">{DIAS_SEMANA_NOMES[diaSemana]} · {MESES[dataSelecionada.getMonth()]}</p>
          </div>
        </div>

        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Treinos Agendados</h3>
          {temTreino ? (
            <div className="space-y-2">
              {treinosDoDia.map(treino => (
                <div key={treino.id} onClick={() => onTreinoSelecionado(treino, dataSelecionada, equipa, obterNumerTreinoGlobal(treino, dataSelecionada, equipa, diasTreino))} className="bg-white border border-gray-200 p-4 md:p-5 rounded-lg cursor-pointer hover:shadow-lg hover:border-blue-300 transition">
                  {/* Header: Data e Hora */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Treino #{obterNumerTreinoGlobal(treino, dataSelecionada, equipa, diasTreino)}</p>
                      <p className="font-semibold text-gray-900">{formatarData(dataSelecionada)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Hora</p>
                      <p className="font-semibold text-gray-900">{treino.hora}</p>
                    </div>
                  </div>

                  {/* Info: Equipa e Escalão */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Equipa</p>
                      <p className="font-semibold text-gray-900 text-sm">{equipa?.nome}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Escalão</p>
                      <p className="font-semibold text-gray-900 text-sm">{equipa?.escalao || '—'}</p>
                    </div>
                  </div>

                  {/* Duração */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Duração</p>
                    <p className="font-semibold text-gray-900">{treino.duracao} min</p>
                  </div>

                  {/* Botão */}
                  <button onClick={onPresencaSwipe} className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition">👆 Marcar Presença</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6 text-sm">Sem treinos agendados</p>
          )}
        </div>
      </div>
    )
  }

  // ===== VISTA SEMANA =====
  const renderizarVistaSemanà = () => {
    const data = new Date(dataSelecionada)
    const diaSemanaAtual = data.getDay()
    // Calcular dias para regressar até segunda (dia 1 em getDay())
    const diasParaRegressar = diaSemanaAtual === 0 ? 6 : diaSemanaAtual - 1
    const segunda = new Date(data)
    segunda.setDate(segunda.getDate() - diasParaRegressar)
    
    const semana = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(segunda)
      d.setDate(d.getDate() + i)
      return d
    })

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4 bg-white p-3 md:p-4 rounded-lg border border-gray-200">
          <button onClick={() => { const d = new Date(dataSelecionada); d.setDate(d.getDate() - 7); setDataSelecionada(d) }} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-lg font-bold">←</button>
          <p className="text-sm md:text-base text-gray-600 whitespace-nowrap">{formatarData(semana[0])} - {formatarData(semana[6])}</p>
          <button onClick={() => { const d = new Date(dataSelecionada); d.setDate(d.getDate() + 7); setDataSelecionada(d) }} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-lg font-bold">→</button>
        </div>

        <div className="grid grid-cols-7 gap-3 md:gap-4 bg-white rounded-lg border border-gray-200 p-4">
          {semana.map((data, index) => (
            <div 
              key={index} 
              onClick={() => setDataSelecionada(data)}
              className="flex flex-col items-center justify-center cursor-pointer p-3 md:p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition hover:bg-gray-50"
            >
              {/* Nome do Dia */}
              <p className="text-xs md:text-sm font-semibold text-gray-600 mb-2">
                {DIAS_SEMANA_NOMES[obterDiaSemana(data)]}
              </p>
              
              {/* Data */}
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {String(data.getDate()).padStart(2, '0')}
              </p>
              
              {/* Indicador de Treino */}
              {temTreinoNoDia(data) && (
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-blue-500 animate-pulse"></div>
              )}
              {!temTreinoNoDia(data) && (
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gray-300"></div>
              )}
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Treinos da Semana</h3>
          {diasTreino.filter(t => t.dia_semana === obterDiaSemana(dataSelecionada) && podeExibirTreinoNaData(dataSelecionada)).length > 0 ? (
            <div className="space-y-2">
              {diasTreino.filter(t => t.dia_semana === obterDiaSemana(dataSelecionada) && podeExibirTreinoNaData(dataSelecionada)).map((treino, index) => (
                <div key={treino.id} onClick={() => onTreinoSelecionado(treino, dataSelecionada, equipa, obterNumerTreinoGlobal(treino, dataSelecionada, equipa, diasTreino))} className="bg-white border border-gray-200 p-4 md:p-5 rounded-lg cursor-pointer hover:shadow-lg hover:border-blue-300 transition">
                  {/* Header: Data e Hora */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Treino #{obterNumerTreinoGlobal(treino, dataSelecionada, equipa, diasTreino)}</p>
                      <p className="font-semibold text-gray-900">{formatarData(dataSelecionada)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Hora</p>
                      <p className="font-semibold text-gray-900">{treino.hora}</p>
                    </div>
                  </div>

                  {/* Info: Equipa e Escalão */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Equipa</p>
                      <p className="font-semibold text-gray-900 text-sm">{equipa?.nome}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Escalão</p>
                      <p className="font-semibold text-gray-900 text-sm">{equipa?.escalao || '—'}</p>
                    </div>
                  </div>

                  {/* Duração */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Duração</p>
                    <p className="font-semibold text-gray-900">{treino.duracao} min</p>
                  </div>

                  {/* Botão */}
                  <button onClick={onPresencaSwipe} className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition">👆 Marcar Presença</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6 text-sm">Sem treinos agendados</p>
          )}
        </div>
      </div>
    )
  }

  // ===== VISTA MÊS =====
  const renderizarVistaMês = () => {
    const ano = dataSelecionada.getFullYear()
    const mes = dataSelecionada.getMonth()
    const primeiro = new Date(ano, mes, 1)
    const ultimo = new Date(ano, mes + 1, 0)
    const diasAnterior = primeiro.getDay() === 0 ? 6 : primeiro.getDay() - 1
    const diasMês = []

    for (let i = diasAnterior; i > 0; i--) {
      const d = new Date(primeiro)
      d.setDate(d.getDate() - i)
      diasMês.push({ data: d, outroMes: true })
    }
    for (let i = 1; i <= ultimo.getDate(); i++) {
      const d = new Date(ano, mes, i, 12, 0, 0) // Adiciona meio-dia para evitar timezone offset
      diasMês.push({ data: d, outroMes: false })
    }
    const diasRestantes = 42 - diasMês.length
    for (let i = 1; i <= diasRestantes; i++) {
      diasMês.push({ data: new Date(ano, mes + 1, i), outroMes: true })
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 bg-white p-3 md:p-4 rounded-lg border border-gray-200 flex-wrap">
          <button onClick={() => { const d = new Date(dataSelecionada); d.setMonth(d.getMonth() - 1); setDataSelecionada(d) }} className="px-2 md:px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-xs md:text-sm">← Ant</button>
          <p className="text-sm md:text-lg font-semibold text-gray-900">{MESES[mes]} {ano}</p>
          <button onClick={() => { const d = new Date(dataSelecionada); d.setMonth(d.getMonth() + 1); setDataSelecionada(d) }} className="px-2 md:px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-xs md:text-sm">Prox →</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(dia => (
            <div key={dia} className="text-center text-xs font-semibold text-gray-600 py-2">{dia}</div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-2 md:p-4">
          <div className="grid grid-cols-7 gap-1">
            {diasMês.map((item, index) => (
              <div key={index} className={`aspect-square rounded flex items-center justify-center cursor-pointer transition text-xs font-medium ${item.outroMes ? 'text-gray-300 bg-gray-50' : temTreinoNoDia(item.data) ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`} onClick={() => !item.outroMes && setDataSelecionada(item.data)}>
                {item.data.getDate()}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Treinos do Mês</h3>
          {diasTreino.filter(t => t.dia_semana === obterDiaSemana(dataSelecionada) && podeExibirTreinoNaData(dataSelecionada)).length > 0 ? (
            <div className="space-y-2">
              {diasTreino.filter(t => t.dia_semana === obterDiaSemana(dataSelecionada) && podeExibirTreinoNaData(dataSelecionada)).map((treino) => (
                <div key={treino.id} onClick={() => onTreinoSelecionado(treino, dataSelecionada, equipa, obterNumerTreinoGlobal(treino, dataSelecionada, equipa, diasTreino))} className="bg-white border border-gray-200 p-4 md:p-5 rounded-lg cursor-pointer hover:shadow-lg hover:border-blue-300 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Treino #{obterNumerTreinoGlobal(treino, dataSelecionada, equipa, diasTreino)}</p>
                      <p className="font-semibold text-gray-900">{formatarData(dataSelecionada)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Hora</p>
                      <p className="font-semibold text-gray-900">{treino.hora}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Equipa</p>
                      <p className="font-semibold text-gray-900 text-sm">{equipa?.nome}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Escalão</p>
                      <p className="font-semibold text-gray-900 text-sm">{equipa?.escalao || '—'}</p>
                    </div>
                  </div>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Duração</p>
                    <p className="font-semibold text-gray-900">{treino.duracao} min</p>
                  </div>
                  <button onClick={onPresencaSwipe} className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition">👆 Marcar Presença</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6 text-sm">Sem treinos agendados</p>
          )}
        </div>
      </div>
    )
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-gray-500">Carregando...</p></div>
  if (!equipa) return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-gray-500">Erro: Equipa não encontrada</p></div>

  const dataEquipaCriada = new Date(equipa.criado_em)
  
  const podeExibirTreinoNaData = (data) => {
    return data >= dataEquipaCriada
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Overlay para fechar dropdown ao clicar fora */}
          {dropdownAberto && (
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setDropdownAberto(false)}
            />
          )}

          {/* Perfil com Dropdown */}
          <div className="relative z-50">
            <button 
              onClick={() => setDropdownAberto(!dropdownAberto)}
              className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm md:text-lg flex-shrink-0">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs md:text-sm text-gray-600">Treinador</p>
                <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{user.email?.split('@')[0]}</p>
              </div>
              <span className={`text-gray-600 transition transform ${dropdownAberto ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {/* Dropdown Menu */}
            {dropdownAberto && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[999] w-48">
                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition">
                  👤 Perfil
                </button>
                <button 
                  onClick={() => {
                    setDropdownAberto(false)
                    onLogout()
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition border-t border-gray-200"
                >
                  🚪 Sair
                </button>
              </div>
            )}
          </div>

          {/* Info da Equipa */}
          <div className="text-right flex-1 md:flex-none">
            <p className="text-base md:text-lg font-semibold text-gray-900 truncate">{equipa.nome}</p>
            <p className="text-xs md:text-sm text-gray-600">{equipa.escalao || 'Sem escalão'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-16 md:top-20 z-40 overflow-x-auto">
        <div className="px-4 flex gap-1">
          {[{ id: 'dia', label: 'Dia' }, { id: 'semana', label: 'Semana' }, { id: 'mes', label: 'Mês' }].map(tabItem => (
            <button key={tabItem.id} onClick={() => setAba(tabItem.id)} className={`px-4 md:px-6 py-3 md:py-4 font-medium transition border-b-2 text-sm md:text-base whitespace-nowrap ${aba === tabItem.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>{tabItem.label}</button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-0 md:max-w-6xl md:mx-auto py-6 md:py-8 relative z-0">
        {aba === 'dia' && renderizarVistaDia()}
        {aba === 'semana' && renderizarVistaSemanà()}
        {aba === 'mes' && renderizarVistaMês()}
      </div>
    </div>
  )
}
