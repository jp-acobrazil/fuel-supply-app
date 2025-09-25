<script setup>
import { ref, watch } from 'vue'

const liters = ref('')
const price = ref('')
const total = ref('')

const litersError = ref('')
const priceError = ref('')
const pumpError = ref('')

const pumpPhotoFile = ref(null)
const pumpFileInput = ref(null)
function triggerPumpUpload() { pumpFileInput.value?.click() }
function onPumpFileChange(e) { 
  pumpPhotoFile.value = e.target.files?.[0] ?? null 
  if (pumpPhotoFile.value) pumpError.value = ''
}

watch([liters, price], ([l, p]) => {
  const lv = Number(l)
  const pv = Number(p)
  if (!isNaN(lv) && !isNaN(pv)) {
    total.value = (lv * pv).toFixed(2)
  } else {
    total.value = ''
  }
})

function validate(opts = {}) {
  const allowMissing = !!opts.allowMissingPhotos
  litersError.value = ''
  priceError.value = ''
  pumpError.value = ''

  if (!liters.value || Number(liters.value) <= 0) {
    litersError.value = 'Obrigatório'
  }
  if (!price.value || Number(price.value) <= 0) {
    priceError.value = 'Obrigatório'
  }
  if (!pumpPhotoFile.value && !allowMissing) {
    pumpError.value = 'Obrigatória'
  }
  return !(litersError.value || priceError.value || pumpError.value)
}

defineExpose({
  getData() {
    return {
      liters: Number(liters.value) || 0,
      pricePerLiter: Number(price.value) || 0,
      total: Number(total.value) || 0,
      pumpPhotoFile: pumpPhotoFile.value || null,
    }
  },
  setData(data = {}) {
    if ('liters' in data) liters.value = data.liters ?? ''
    if ('pricePerLiter' in data) price.value = data.pricePerLiter ?? ''
    if ('fuelType' in data) {/* ignorado aqui, tratado em Vehicle */}
  },
  validate
})
</script>

<template>
  <div class="grid">
    <label class="field" :class="{ invalid: litersError }">
      <span>Qtd em litros *</span>
      <input type="number" name="fuelLiters" inputmode="decimal" min="0" step="0.001" v-model="liters" placeholder="0" @input="litersError = ''" />
      <small v-if="litersError" class="err">{{ litersError }}</small>
    </label>
    <label class="field" :class="{ invalid: priceError }">
      <span>Preço do litro *</span>
      <input type="number" name="fuelPrice" inputmode="decimal" min="0" step="0.01" v-model="price" placeholder="0,00" @input="priceError = ''" />
      <small v-if="priceError" class="err">{{ priceError }}</small>
    </label>

    <label class="field">
      <span>Valor total</span>
      <input type="text" name="fuelTotal" :value="total" disabled readonly aria-readonly="true" />
    </label>
  </div>
  <div class="field file" :class="{ invalid: pumpError }">
    <span>Foto bomba de comb. *</span>
    <input ref="pumpFileInput" type="file" accept="image/*" @change="onPumpFileChange" style="display:none" />
    <button type="button" class="upload" aria-label="upload" @click="triggerPumpUpload">⬆</button>
    <small v-if="pumpPhotoFile" class="hint">{{ pumpPhotoFile.name }}</small>
    <small v-if="pumpError" class="err">{{ pumpError }}</small>
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
  height: 44px; /* melhor alvo de toque */
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 10px;
  background: #fff;
  color: #333;
  font-size: 16px; /* evita zoom no iOS */
}

.file {
  margin-top: 10px;
  align-items: flex-start;
  justify-content: flex-end;
}

.hint {
  color: #6b7280;
  font-size: 11px;
  margin-top: 4px;
}

.upload {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #0b5d3b;
  color: #fff;
  border: none;
}

.err { color: #b91c1c; font-size: 11px; }
.field.invalid input, .field.invalid .upload { border-color: #b91c1c; }
.field.invalid span { color: #b91c1c; }

/* Tema fixo claro */
</style>
