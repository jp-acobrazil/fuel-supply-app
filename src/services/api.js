import axios from 'axios'

// Em desenvolvimento, use o proxy do Vite: '/api' -> vite.config.js redireciona para o backend
// Em produção, use a VITE_API_URL
const base = import.meta.env.DEV
	? '/api'
	: (import.meta.env.VITE_API_URL || 'https://api.acobrazil.com.br/abastecimento/api')

const api = axios.create({ baseURL: base, timeout: 15000, withCredentials: true })

export default api
