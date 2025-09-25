import { ref } from 'vue'
import api from './api'

// Estado global do usuário
const currentUser = ref(null)
const isLoading = ref(false)
const error = ref(null)

// Obter informações do usuário logado
export async function fetchCurrentUser() {
  try {
    isLoading.value = true
    error.value = null
    
    // Em ambiente de desenvolvimento, usar um ID de motorista para testes
    if (import.meta.env.DEV) {
      currentUser.value = { id: 98, name: 'Motorista Teste' }
      return currentUser.value
    }
    
  // Em produção, buscar do backend (endpoint user-details)
  const { data } = await api.get('https://api.acobrazil.com.br/authenticate/auth/user-details', { withCredentials: true })

  console.log('Dados do usuário obtidos:', data)
  
  // Mapear usuarioErp como id para compatibilidade
  currentUser.value = { ...data, id: data.usuarioErp }
  console.log('Usuário atual:', currentUser.value)
  return currentUser.value
  } catch (err) {
    console.error('Erro ao obter usuário atual:', err)
    error.value = 'Não foi possível obter informações do usuário'
    return null
  } finally {
    isLoading.value = false
  }
}

// Obter ID do motorista atual
export function getCurrentDriverId() {
  return currentUser.value?.id || null
}

// Verificar se o usuário está carregado
export function isUserLoaded() {
  return !!currentUser.value
}

// Exportar estado reativo
export { currentUser, isLoading, error }