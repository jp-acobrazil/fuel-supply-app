<script setup>
import { ref } from 'vue'

const plate = ref('')
const fuel = ref('')
const odometer = ref('')

const plateError = ref('')
const fuelError = ref('')
const odoError = ref('')
const photoError = ref('')

const odoPhoto = ref(null)
const odoInput = ref(null)
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
  if (!odometer.value || Number(odometer.value) <= 0) odoError.value = 'Obrigatório'
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
  validate
})

const fuelOptions = [
  'Gasolina comum',
  'Gasolina aditivada',
  'Etanol',
  'Diesel S10',
  'Diesel S500',
]
</script>

<template>
  <div class="grid">
    <label class="field" :class="{ invalid: plateError }">
      <span>Placa do veículo *</span>
      <input v-model="plate" placeholder="ABC-1234" autocapitalize="characters" @input="plate = plate.toUpperCase(); plateError = ''" />
      <small v-if="plateError" class="err">{{ plateError }}</small>
    </label>

    <label class="field" :class="{ invalid: fuelError }">
      <span>Tipo de combust. *</span>
      <select v-model="fuel" @change="fuelError = ''">
        <option value="" disabled>Selecione</option>
        <option v-for="opt in fuelOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
      <small v-if="fuelError" class="err">{{ fuelError }}</small>
    </label>
    <label class="field" :class="{ invalid: odoError }">
      <span>Hodometro *</span>
      <input v-model="odometer" type="number" inputmode="numeric" placeholder="0" @input="odoError = ''" />
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
  grid-template-columns: 1fr; /* mobile-first */
  gap: 12px;
}
@media (min-width: 480px) {
  .grid { grid-template-columns: 1fr 1fr; }
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

.err { color: #b91c1c; font-size: 11px; }
.field.invalid input, .field.invalid .upload { border-color: #b91c1c; }
.field.invalid span { color: #b91c1c; }

/* Tema fixo claro */
</style>
