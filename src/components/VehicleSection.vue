<script setup>
import { ref, watch, computed } from 'vue'
import api from '../services/api'

const plate = ref('')
const fuel = ref('')
const odometer = ref('')

const plateError = ref('')
const fuelError = ref('')
const odoError = ref('')
const photoError = ref('')

const odoPhoto = ref(null)
const odoInput = ref(null)
const plateInput = ref(null)
function triggerOdoUpload() { odoInput.value?.click() }
function onOdoChange(e) {
  odoPhoto.value = e.target.files?.[0] ?? null
  if (odoPhoto.value) photoError.value = ''
}

function validate(opts = {}) {
  const allowMissing = !!opts.allowMissingPhotos
  plateError.value = ''
  fuelError.value = ''
  odoError.value = ''
  photoError.value = ''

  if (!plate.value.trim()) plateError.value = 'Obrigatório'
  if (!fuel.value.trim()) fuelError.value = 'Obrigatório'
  const odoNum = Number(odometer.value)
  if (!odometer.value || odoNum <= 0) {
    odoError.value = 'Obrigatório'
  } else if (lastOdo.value && odoNum <= lastOdo.value) {
    odoError.value = `Deve ser maior que o último (${lastOdo.value})`
  }
  if (!odoPhoto.value && !allowMissing) photoError.value = 'Obrigatória'
  return !(plateError.value || fuelError.value || odoError.value || photoError.value)
}

defineExpose({
  getData() {
    return {
      plate: plate.value,
      fuelType: fuel.value,
      odometer: Number(odometer.value) || 0,
      odoPhoto: odoPhoto.value || null,
    }
  },
  setData(data = {}) {
    if ('plate' in data) plate.value = data.plate ?? ''
    if ('fuelType' in data) fuel.value = data.fuelType ?? ''
    if ('odometer' in data) odometer.value = data.odometer ?? ''
  },
  validate,
  setPlateError(msg = 'Placa inválida') {
    plateError.value = msg
    // opcional: focar no campo da placa para correção rápida
    plateInput.value?.focus?.()
  }
})

// ===== Infos do veículo (busca por placa) =====
const infoLoading = ref(false)
const infoError = ref('')
const vehicleInfo = ref(null) // { ultimoHodometroRegistrado, placa, modeloVeiculo, dataUltimoAbastecimento }
let infoDebounce = 0
let lastRequestKey = ''

function sanitizePlateForLookup(p) {
  const s = String(p ?? '').trim().toUpperCase()
  // remover hífens e espaços internos explícitos
  const noSep = s.replace(/[-\s]/g, '')
  // manter apenas letras e números (A-Z 0-9)
  const alnum = noSep.replace(/[^A-Z0-9]/g, '')
  return alnum.slice(0, 7)
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

async function fetchVehicleInfos(plateSanitized) {
  if (!plateSanitized || plateSanitized.length < 7) return
  const reqKey = `${plateSanitized}-${Date.now()}`
  lastRequestKey = reqKey
  infoLoading.value = true
  infoError.value = ''
  try {
    const { data } = await api.get(`/vehicles/${plateSanitized}/infos`)
    // Evitar corrida: só aplica se for a última requisição iniciada
    if (lastRequestKey === reqKey) {
      vehicleInfo.value = data || null
    }
  } catch (e) {
    if (lastRequestKey === reqKey) {
      vehicleInfo.value = null
      // Mensagem amigável
      infoError.value = e?.response?.status === 404
        ? 'Veículo não encontrado'
        : 'Não foi possível buscar informações do veículo.'
    }
  } finally {
    if (lastRequestKey === reqKey) infoLoading.value = false
  }
}

watch(plate, (val) => {
  // limpar estado
  infoError.value = ''
  vehicleInfo.value = null
  const p = sanitizePlateForLookup(val)
  if (!p || p.length < 7) {
    infoLoading.value = false
    return
  }
  // debounce 500ms
  clearTimeout(infoDebounce)
  infoDebounce = setTimeout(() => fetchVehicleInfos(p), 500)
})

const fuelOptions = [
  'Gasolina comum',
  'Gasolina aditivada',
  'Etanol',
  'Diesel S10',
  'Diesel S500',
]

// Último hodômetro como número, para validação e min do input
const lastOdo = computed(() => {
  const raw = vehicleInfo.value?.ultimoHodometroRegistrado
  if (raw == null) return 0
  const num = Number(String(raw).replace(/[^0-9.-]/g, ''))
  return isNaN(num) ? 0 : num
})
</script>

<template>
  <div class="grid">
    <label class="field" :class="{ invalid: plateError }">
      <span>Placa do veículo *</span>
      <input class="small truncate" ref="plateInput" v-model="plate" :title="plate" placeholder="ACO1B23"
        autocapitalize="characters" @input="plate = plate.toUpperCase(); plateError = ''" />
      <small v-if="plateError" class="err">{{ plateError }}</small>
    </label>
    <!-- Modelo ao lado da Placa -->
    <label class="field">
      <span>Modelo</span>
      <input class="small truncate" disabled :value="vehicleInfo?.modeloVeiculo || '-'"
        :title="vehicleInfo?.modeloVeiculo || ''" />
    </label>

    <!-- Linha 2: Infos como campos uniformes -->
    <label class="field">
      <span>Últ. abastecimento</span>
      <input class="small" disabled :value="vehicleInfo ? formatDate(vehicleInfo.dataUltimoAbastecimento) : '-'" />
      <small v-if="infoLoading" class="hint">Buscando...</small>
      <small v-else-if="infoError" class="err">{{ infoError }}</small>
    </label>
    <label class="field">
      <span>Últ. hodômetro</span>
      <input class="small" disabled :value="vehicleInfo?.ultimoHodometroRegistrado || '-'" />
    </label>

    <!-- Campos obrigatórios ao final -->
    <label class="field" :class="{ invalid: fuelError }">
      <span>Tipo de combustível *</span>
      <select class="small" v-model="fuel" @change="fuelError = ''">
        <option value="" disabled>Selecione</option>
        <option v-for="opt in fuelOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
      <small v-if="fuelError" class="err">{{ fuelError }}</small>
    </label>
    <label class="field" :class="{ invalid: odoError }">
      <span>Hodômetro *</span>
      <input class="small" v-model="odometer" type="number" inputmode="numeric" placeholder="0" :min="lastOdo || null"
        @input="odoError = ''" />
      <small v-if="odoError" class="err">{{ odoError }}</small>
    </label>

    <div class="field file" :class="{ invalid: photoError }">
      <span>Foto do hodometro legível *</span>
      <input ref="odoInput" type="file" accept="image/*" @change="onOdoChange" style="display:none" />
      <button type="button" class="upload" aria-label="upload" @click="triggerOdoUpload">⬆</button>
      <small v-if="odoPhoto" class="hint">{{ odoPhoto.name }}</small>
      <small v-if="photoError" class="err">{{ photoError }}</small>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* duas colunas também no mobile */
  gap: 12px;
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

input {
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 10px;
  background: #fff;
  color: #333;
  font-size: 16px;
}

/* inputs menores para reduzir ocupação visual */
.small {
  width: 150px;
}

select {
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 10px;
  background: #fff;
  color: #333;
  font-size: 16px;
}

.file {
  grid-column: 1 / -1;
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

.err {
  color: #b91c1c;
  font-size: 11px;
}

.field.invalid input,
.field.invalid .upload {
  border-color: #b91c1c;
}

.field.invalid span {
  color: #b91c1c;
}

/* Tema fixo claro */

/* Infos do veículo (dicas) reutilizam .hint e .err */

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
