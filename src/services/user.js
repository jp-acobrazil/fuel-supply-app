import { ref } from 'vue'
import api from './api'

// Estado global do usuário
const currentUser = ref(null)
const isLoading = ref(false)
const error = ref(null)

// Estado de permissão para a aba Gerenciamento
const hasGerenciamentoAccess = ref(false)
const isCheckingPermission = ref(false)

// Obter informações do usuário logado
export async function fetchCurrentUser() {
  try {
    isLoading.value = true
    error.value = null
    
    // Em ambiente de desenvolvimento, usar dados mockados para testes
    if (import.meta.env.DEV) {
      // matricula mockada conforme exemplo fornecido
      currentUser.value = { id: 98, name: 'Motorista Teste', matricula: '10000287' }
      return currentUser.value
    }
    
  // Em produção, buscar do backend (endpoint user-details)
  const { data } = await api.get('https://api.acobrazil.com.br/authenticate/auth/user-details', { withCredentials: true })

  console.log('Dados do usuário obtidos:', data)
  
  // Mapear usuarioErp como id para compatibilidade e garantir matricula
  currentUser.value = { ...data, id: data.usuarioErp, matricula: data.matricula ?? data.usuarioErp }
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

// Checar permissão de acesso à aba Gerenciamento
export async function checkGerenciamentoAccess() {
  try {
    isCheckingPermission.value = true
    // Se estiver em DEV, liberar acesso para facilitar testes
    if (import.meta.env.DEV) {
      hasGerenciamentoAccess.value = true
      return true
    }

    // Garantir que o usuário está carregado
    if (!currentUser.value) {
      await fetchCurrentUser()
    }

    const codUsur = currentUser.value?.matricula
    const hashControle = '918001'
    if (!codUsur) {
      console.warn('Matricula do usuário não encontrada; negando acesso por segurança.')
      hasGerenciamentoAccess.value = false
      return false
    }

    const url = 'https://api.acobrazil.com.br/authenticate/perm/subpermissao'
    const { data } = await api.get(url, {
      params: { codUsur, hashControle },
      withCredentials: true,
    })

    // Tentar interpretar diferentes formatos de resposta como verdadeiros
    const allowed = Boolean(
      data === true ||
      data?.permitido === true ||
      data?.autorizado === true ||
      data?.acesso === true ||
      (Array.isArray(data) && data.length > 0) ||
      (typeof data === 'object' && Object.keys(data || {}).length > 0)
    )

    hasGerenciamentoAccess.value = allowed
    return allowed
  } catch (err) {
    console.error('Erro ao verificar permissão de Gerenciamento:', err)
    hasGerenciamentoAccess.value = false
    return false
  } finally {
    isCheckingPermission.value = false
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
export { currentUser, isLoading, error, hasGerenciamentoAccess, isCheckingPermission }