import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, error } = useAuth()
  const [localError, setLocalError] = useState('')

  const validateForm = () => {
    setLocalError('')
    
    if (!email.trim()) {
      setLocalError('Email é obrigatório')
      return false
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Email inválido')
      return false
    }
    
    if (!password) {
      setLocalError('Password é obrigatória')
      return false
    }
    
    if (password.length < 6) {
      setLocalError('Password deve ter pelo menos 6 caracteres')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await login(email, password)
      onLoginSuccess()
    } catch (err) {
      setLocalError(err.message || 'Erro ao fazer login')
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Trainer</h1>
          <p className="text-gray-500">Gerir a tua equipa de treino</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {displayError}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teu@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg transition duration-200 mt-6"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Não tens conta? <span className="text-blue-600 cursor-pointer">Cria uma aqui</span>
        </p>
      </div>
    </div>
  )
}
