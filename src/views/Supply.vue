<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FuelSection from '../components/FuelSection.vue'
import VehicleSection from '../components/VehicleSection.vue'
import OnRouteSection from '../components/OnRouteSection.vue'
import api from '../services/api'
import { fetchCurrentUser, getCurrentDriverId } from '../services/user'
import { compressImage, validateFileSize, formatFileSize, compressImageToTarget, validateTotalSize } from '../utils/fileUtils'
import { useSideMenu } from '../composables/useSideMenu'

const fuelRef = ref(null)
const vehicleRef = ref(null)
const routeRef = ref(null)
const router = useRouter()
const driverId = ref(null)
const route = useRoute()
const editingId = ref(route.params.id || null)
const approvalComment = ref('')
const originalStatus = ref('')
const emRotaEnabled = ref(false)
const extraAttachments = ref([])
const extraAttachInput = ref(null)
function triggerExtraAttach() { extraAttachInput.value?.click() }
function onExtraAttachChange(e) {
  const files = Array.from(e.target.files || []).filter(f => (f && f.type && f.type.startsWith('image/')))
  extraAttachments.value = files
}

const { toggle: toggleMenu } = useSideMenu()

onMounted(async () => {
  await fetchCurrentUser()
  driverId.value = getCurrentDriverId()
  if (editingId.value) {
    // Carregar dados existentes para edição de rejeitado
    try {
      const { data } = await api.get(`/supplies/${editingId.value}`)
      if (fuelRef.value && data) {
        fuelRef.value.setData?.({ liters: data.liters, pricePerLiter: data.pricePerLiter, fuelType: data.fuelType })
      }
      if (vehicleRef.value && data) {
        vehicleRef.value.setData?.({ plate: data.vehicle?.plate || data.plate, odometer: data.odometer, fuelType: data.fuelType })
      }
      if (routeRef.value && data) {
        const hasRoute = data.stationCnpj || data.stationName || data.obs
        emRotaEnabled.value = !!hasRoute
        routeRef.value.setData?.({ stationCnpj: data.stationCnpj, stationName: data.stationName, obs: data.obs })
      }
      approvalComment.value = data.approvalComment || ''
      originalStatus.value = data.status || ''
    } catch (e) { console.error('Falha ao carregar supply para edição', e) }
  }
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

    const inEdit = !!editingId.value
    const fuelValid = fuelRef.value?.validate?.({ allowMissingPhotos: inEdit })
    const vehicleValid = vehicleRef.value?.validate?.({ allowMissingPhotos: inEdit })
    if (!fuelValid || !vehicleValid) {
      message.value = 'Preencha todos os campos obrigatórios marcados com *.'

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

    const payload = {
      driverId: driverId.value,
      liters: toNumber(f.liters),
      pricePerLiter: toNumber(f.pricePerLiter),
      plate: v.plate,
      fuelType: v.fuelType,
      odometer: toNumber(v.odometer),
      stationCnpj: onlyDigits(r.stationCnpj),
      stationName: r.stationName,
      obs: r.obs,
    }

    console.log('Payload', payload)
    console.log('Driver ID atual:', driverId.value, 'getCurrentDriverId():', getCurrentDriverId())

    if (!payload.liters || !payload.pricePerLiter || !payload.plate) {
      message.value = 'Preencha litros, preço do litro e placa.'
      return
    }

    let supplyId = editingId.value
    if (editingId.value) {
      console.log('Atualizando supply ID', editingId.value, 'payload:', payload)
      const { data: updated } = await api.put(`/supplies/${editingId.value}`, payload, { headers: { 'Content-Type': 'application/json' } })
      supplyId = updated.id
      message.value = 'Abastecimento atualizado com sucesso.'
    } else {
      console.log('Enviando payload JSON:', payload)
      const { data: supplyResponse } = await api.post('/supplies', payload, {
        headers: { 'Content-Type': 'application/json' }
      })
      supplyId = supplyResponse.id
      console.log('Supply criado:', supplyId)
    }

    // 2. Enviar arquivos se houver algum
    const hasFiles = f.pumpPhotoFile || v.odoPhoto || (extraAttachments.value.length > 0)

    if (hasFiles) {
      console.log('Enviando arquivos para supply ID:', supplyId)
      const filesForm = new FormData()

      // Objetivo: soma total <= 1MB (1024 KB)
      const MAX_TOTAL_KB = 1024
      const candidates = [] // manter arquivos processados antes de anexar

      if (f.pumpPhotoFile) {
        console.log(`pumpPhoto original: ${formatFileSize(f.pumpPhotoFile.size)}`)
        let compressedPump = await compressImageToTarget(f.pumpPhotoFile, { targetKB: 512 })
        console.log(`pumpPhoto comprimida: ${formatFileSize(compressedPump.size)}`)
        candidates.push({ key: 'pumpPhoto', file: compressedPump })
      }

      if (v.odoPhoto) {
        console.log(`odometerPhoto original: ${formatFileSize(v.odoPhoto.size)}`)
        let compressedOdo = await compressImageToTarget(v.odoPhoto, { targetKB: 400 })
        console.log(`odometerPhoto comprimida: ${formatFileSize(compressedOdo.size)}`)
        candidates.push({ key: 'odometerPhoto', file: compressedOdo })
      }

      if (extraAttachments.value.length) {
        for (let i = 0; i < extraAttachments.value.length; i++) {
          const file = extraAttachments.value[i]
          if (!file) continue
          console.log(`extra attachment ${i} original: ${formatFileSize(file.size)}`)
          let processedFile = file
          if (file.type.startsWith('image/')) {
            processedFile = await compressImageToTarget(file, { targetKB: 256 })
            console.log(`extra attachment ${i} comprimido: ${formatFileSize(processedFile.size)}`)
          }
          candidates.push({ key: 'attachments', file: processedFile })
        }
      }

      // 1) Checar total; se exceder, tentar re-comprimir em alvos menores
      let totalOk = validateTotalSize(candidates.map(c => c.file), MAX_TOTAL_KB)
      if (!totalOk) {
        console.log('Total de anexos > 1MB; tentando re-compressão...')
        // Estratégia de reassignment de alvo: diminuir para cada item
        const descTargets = {
          pumpPhoto: 400,
          odometerPhoto: 300,
          attachments: 200,
        }
        // Iterar e recomprimir até 2 tentativas
        for (let round = 0; round < 2 && !totalOk; round++) {
          for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i]
            if (!c.file.type.startsWith('image/')) continue
            const newTarget = Math.max(100, Math.floor((descTargets[c.key] || 200) * (round === 0 ? 1 : 0.75)))
            const recompressed = await compressImageToTarget(c.file, { targetKB: newTarget })
            if (recompressed.size < c.file.size) {
              console.log(`${c.key} re-comprimido: ${formatFileSize(c.file.size)} -> ${formatFileSize(recompressed.size)}`)
              c.file = recompressed
            }
          }
          totalOk = validateTotalSize(candidates.map(c => c.file), MAX_TOTAL_KB)
        }
      }

      if (!totalOk) {
        const totalBytes = candidates.reduce((acc, c) => acc + c.file.size, 0)
        throw new Error(`Soma dos anexos excede 1MB (${formatFileSize(totalBytes)}). Reduza a quantidade ou tamanho das imagens.`)
      }

      // 2) Anexar no FormData
      for (const c of candidates) {
        filesForm.append(c.key, c.file)
      }

      // 3) Upload dos arquivos comprimidos
      await api.post(`/supplies/${supplyId}/files`, filesForm)
      console.log('Arquivos enviados com sucesso!')
    }

    if (!editingId.value) {
      message.value = 'Abastecimento cadastrado com sucesso.'
    }
    // Redirecionar para Home já atualizada
    router.push({ name: 'home', query: { r: Date.now() } })
  } catch (err) {
    console.error(err)
    // Mapeamento de mensagens técnicas para textos amigáveis
    const rawMsg = err?.response?.data?.message || err?.message || ''
    if (/Vehicle not found/i.test(rawMsg)) {
      message.value = 'Não encontramos um veículo com a placa informada. Verifique a placa e tente novamente.'
      // Se possível, destacar o campo de placa no formulário
      vehicleRef.value?.setPlateError?.('Não encontrado')
    } else {
      message.value = rawMsg || 'Falha ao cadastrar abastecimento.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="app-bar">
      <button class="menu-btn" aria-label="menu" @click="toggleMenu">☰</button>
      <a href="https://portal.acobrazil.com.br/" target="_blank" rel="noopener noreferrer">
        <img src="/src/assets/logoacobrazil.png" class="brand" alt="logo" />
      </a>
      <div class="actions">
        <span class="badge">3</span>
      </div>
    </header>

    <main class="content">
      <div class="top-actions">
        <button class="btn back" @click="() => router.push({ name: 'home' })">← Voltar</button>
      </div>
      <h1 class="title">Abastecimento</h1>
      <div v-if="editingId && originalStatus === 'R' && approvalComment" class="rejection-box">
        <strong>Motivo da reprovação:</strong>
        <p>{{ approvalComment }}</p>
      </div>

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
        <div class="field file">
          <span>Foto adicional</span>
          <input ref="extraAttachInput" type="file" accept="image/*" multiple @change="onExtraAttachChange"
            style="display:none" />
          <button type="button" class="upload" aria-label="upload" @click="triggerExtraAttach">⬆</button>
          <template v-if="extraAttachments.length === 1">
            <small class="hint">{{ extraAttachments[0].name }}</small>
          </template>
          <template v-else-if="extraAttachments.length > 1">
            <small class="hint">{{ extraAttachments.length }} foto(s) selecionada(s)</small>
          </template>
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

.top-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 6px 0 6px;
}

.btn.back {
  height: 32px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 0 10px;
  background: #fff;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
}

.btn.back:hover {
  background: #f3f4f6;
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

.rejection-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  margin: -4px 0 14px;
}

.rejection-box p {
  margin: 4px 0 0;
  white-space: pre-wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field>span {
  font-size: 12px;
  color: #555;
}

.file {
  align-items: flex-start;
}

.upload {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #0b5d3b;
  color: #fff;
  border: none;
}

.hint {
  color: #6b7280;
  font-size: 11px;
  margin-top: 4px;
}
</style>
