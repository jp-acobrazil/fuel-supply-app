<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FuelSection from '../components/FuelSection.vue'
import VehicleSection from '../components/VehicleSection.vue'
import OnRouteSection from '../components/OnRouteSection.vue'
import api from '../services/api'
import { fetchCurrentUser, getCurrentDriverId } from '../services/user'
import { compressImage, validateFileSize, formatFileSize } from '../utils/fileUtils'
import { useSideMenu } from '../composables/useSideMenu'

const fuelRef = ref(null)
const vehicleRef = ref(null)
const routeRef = ref(null)
const router = useRouter()
const driverId = ref(null)
// Controle externo para habilitar/desabilitar a seção "Em Rota"
const emRotaEnabled = ref(false)
// Anexos gerais (fora da seção Em Rota)
const extraAttachments = ref([])
const extraAttachInput = ref(null)
function triggerExtraAttach() { extraAttachInput.value?.click() }
function onExtraAttachChange(e) { extraAttachments.value = Array.from(e.target.files || []) }

// Side menu
const { toggle: toggleMenu } = useSideMenu()

onMounted(async () => {
  // Carregar informações do usuário e obter o ID do motorista
  await fetchCurrentUser()
  driverId.value = getCurrentDriverId()
  console.log('ID do motorista:', driverId.value)
})

const loading = ref(false)
const message = ref('')

function toNumber(val) {
  if (val === undefined || val === null) return 0
  const s = String(val).replace(',', '.')
  const n = Number(s)
  return isNaN(n) ? 0 : n
}
function onlyDigits(val) {
  return String(val || '').replace(/\D+/g, '')
}

async function submitSupply() {
  try {
    loading.value = true
    message.value = ''

    // Validações obrigatórias nas seções
    const fuelValid = fuelRef.value?.validate?.()
    const vehicleValid = vehicleRef.value?.validate?.()
    if (!fuelValid || !vehicleValid) {
      message.value = 'Preencha todos os campos obrigatórios marcados com *.'
      // Próximo tick para garantir atualização de classes
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector('.field.invalid')
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
      return
    }

    const f = fuelRef.value?.getData?.() || {}
    const v = vehicleRef.value?.getData?.() || {}
    const r = routeRef.value?.getData?.() || {}

    // Mapear para o payload esperado pela API (dados primários)
    const payload = {
      driverId: driverId.value,
      liters: toNumber(f.liters),
      pricePerLiter: toNumber(f.pricePerLiter),
      plate: v.plate,
      fuelType: v.fuelType,
      odometer: toNumber(v.odometer),
      stationCnpj: onlyDigits(r.stationCnpj),
      obs: r.obs,
    }

    console.log('Payload', payload)
    console.log('Driver ID atual:', driverId.value, 'getCurrentDriverId():', getCurrentDriverId())

    if (!payload.liters || !payload.pricePerLiter || !payload.plate) {
      message.value = 'Preencha litros, preço do litro e placa.'
      return
    }

    // 1. Criar o supply com JSON
    console.log('Enviando payload JSON:', payload)
    const { data: supplyResponse } = await api.post('/supplies', payload, {
      headers: { 'Content-Type': 'application/json' }
    })

    console.log('Supply criado:', supplyResponse)
    const supplyId = supplyResponse.id

    // 2. Enviar arquivos se houver algum
    const hasFiles = f.pumpPhotoFile || v.odoPhoto || (extraAttachments.value.length > 0)

    if (hasFiles) {
      console.log('Enviando arquivos para supply ID:', supplyId)
      const filesForm = new FormData()

      // Comprimir e validar arquivos antes do envio
      if (f.pumpPhotoFile) {
        console.log(`pumpPhoto original: ${formatFileSize(f.pumpPhotoFile.size)}`)
        const compressedPump = await compressImage(f.pumpPhotoFile, 1280, 720, 0.7, 1024)
        console.log(`pumpPhoto comprimida: ${formatFileSize(compressedPump.size)}`)

        if (!validateFileSize(compressedPump, 1024)) { // 1MB limite
          throw new Error(`Foto da bomba muito grande: ${formatFileSize(compressedPump.size)}. Máximo: 1MB`)
        }

        filesForm.append('pumpPhoto', compressedPump)
      }

      if (v.odoPhoto) {
        console.log(`odometerPhoto original: ${formatFileSize(v.odoPhoto.size)}`)
        const compressedOdo = await compressImage(v.odoPhoto, 1280, 720, 0.7, 1024)
        console.log(`odometerPhoto comprimida: ${formatFileSize(compressedOdo.size)}`)

        if (!validateFileSize(compressedOdo, 1024)) {
          throw new Error(`Foto do hodômetro muito grande: ${formatFileSize(compressedOdo.size)}. Máximo: 1MB`)
        }

        filesForm.append('odometerPhoto', compressedOdo)
      }

      if (extraAttachments.value.length) {
        for (let i = 0; i < extraAttachments.value.length; i++) {
          const file = extraAttachments.value[i]
          if (!file) continue
          console.log(`extra attachment ${i} original: ${formatFileSize(file.size)}`)
          let processedFile = file
          if (file.type.startsWith('image/')) {
            processedFile = await compressImage(file, 1280, 720, 0.7, 1024)
            console.log(`extra attachment ${i} comprimido: ${formatFileSize(processedFile.size)}`)
          }
          if (!validateFileSize(processedFile, 1024)) {
            throw new Error(`Anexo "${file.name}" muito grande: ${formatFileSize(processedFile.size)}. Máximo: 1MB`)
          }
          filesForm.append('attachments', processedFile)
        }
      }

      // Upload dos arquivos comprimidos
      await api.post(`/supplies/${supplyId}/files`, filesForm)
      console.log('Arquivos enviados com sucesso!')
    }

    message.value = 'Abastecimento cadastrado com sucesso.'
    // Redirecionar para Home já atualizada
    router.push({ name: 'home', query: { r: Date.now() } })
  } catch (err) {
    console.error(err)
    message.value = err?.response?.data?.message || 'Falha ao cadastrar abastecimento.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="app-bar">
  <button class="menu-btn" aria-label="menu" @click="toggleMenu">☰</button>
      <img src="/src/assets/logoacobrazil.png" class="brand" alt="logo" />
      <div class="actions">
        <span class="badge">3</span>
      </div>
    </header>

    <main class="content">
      <h1 class="title">Abastecimento</h1>

      <section class="card">
        <h2 class="card-title">Combustível</h2>
        <FuelSection ref="fuelRef" />
      </section>

      <section class="card">
        <h2 class="card-title">Veículo</h2>
        <VehicleSection ref="vehicleRef" />
      </section>

      <section class="card">
        <div class="card-title route-wrapper">
          <label class="route-checkbox">
            <input type="checkbox" v-model="emRotaEnabled" aria-label="Ativar campos Em Rota" />
          </label>
          <h2 class="route-heading">Em Rota</h2>
        </div>
        <OnRouteSection ref="routeRef" :enabled="emRotaEnabled" />
      </section>
      <section class="card attachments-card">
        <h2 class="card-title">Outros anexos</h2>
        <div class="attachments-field">
          <input ref="extraAttachInput" type="file" multiple @change="onExtraAttachChange" style="display:none" />
          <button type="button" class="upload" aria-label="upload" @click="triggerExtraAttach">⬆</button>
          <small v-if="extraAttachments.length" class="hint">{{ extraAttachments.length }} arquivo(s)
            selecionado(s)</small>
        </div>
      </section>
      <p v-if="message" class="feedback">{{ message }}</p>
      <div class="bottom-spacer" />
    </main>

    <footer class="action-bar">
      <button class="primary" :disabled="loading" @click="submitSupply">{{ loading ? 'Enviando...' : 'Enviar'
      }}</button>
    </footer>
  </div>

</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  /* menu | logo (center) | actions */
  align-items: center;
  gap: 12px;
  padding: calc(8px + env(safe-area-inset-top)) 12px 10px;
  background: #0b5d3b;
  color: #fff;
}

.menu-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.menu-btn {
  justify-self: start;
}

.brand {
  height: 24px;
  justify-self: center;
}

.actions {
  justify-self: end;
  margin-left: 0;
}

.badge {
  background: #ffc107;
  color: #0b5d3b;
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 700;
}

.content {
  padding: 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  max-width: 520px;
  margin: 0 auto;
  width: 100%;
}

.title {
  margin: 8px 0 16px;
  font-size: 22px;
}

.card {
  background: var(--card-bg, #fff);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .1);
  border: 1px solid rgba(0, 0, 0, .05);
  margin-bottom: 12px;
}

.card-title {
  text-align: center;
  margin: 4px 0 12px;
  font-size: 18px;
}

.route-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 4px 0 12px;
}

.route-heading {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.route-checkbox {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

.route-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #0b5d3b;
  cursor: pointer;
}

.bottom-spacer {
  height: 72px;
}

.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: #ffffffcc;
  backdrop-filter: blur(6px);
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(0, 0, 0, .06);
  display: flex;
  justify-content: center;
}

.action-bar .primary {
  width: 100%;
  max-width: 520px;
  height: 48px;
  border-radius: 10px;
  border: none;
  background: #0b5d3b;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}

.action-bar .primary[disabled] {
  opacity: .6;
}

.feedback {
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 14px;
}

.attachments-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.attachments-field .upload {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #0b5d3b;
  color: #fff;
  border: none;
}

.attachments-field .hint {
  color: #6b7280;
  font-size: 11px;
}
</style>
