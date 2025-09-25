<script setup>
import { ref } from 'vue'
const props = defineProps({
  enabled: { type: Boolean, default: true }
})

const cnpj = ref('')
const station = ref('')
const notes = ref('')

const attachments = ref([])
const attachInput = ref(null)
function triggerAttach() { attachInput.value?.click() }
function onAttachChange(e) { attachments.value = Array.from(e.target.files || []) }
defineExpose({
  getData() {
    if (!props.enabled) {
      return { stationCnpj: '', stationName: '', obs: '', attachments: [] }
    }
    return {
      stationCnpj: cnpj.value,
      stationName: station.value,
      obs: notes.value,
      attachments: attachments.value,
    }
  }
})
</script>

<template>
  <div class="grid" :class="{ disabled: !props.enabled }">
    <label class="field">
      <span>CNPJ do posto</span>
  <input v-model="cnpj" :disabled="!props.enabled" inputmode="numeric" placeholder="00.000.000/0000-00" />
    </label>
    <label class="field">
      <span>Nome do posto</span>
  <input v-model="station" :disabled="!props.enabled" placeholder="Posto XYZ" />
    </label>

    
    <label class="field">
      <span>Observações</span>
  <textarea v-model="notes" :disabled="!props.enabled" placeholder="Digite aqui..." rows="4" />
    </label>

    <div class="field file">
      <span>Outros anexos</span>
      <input ref="attachInput" type="file" multiple @change="onAttachChange" style="display:none" />
      <button type="button" class="upload" aria-label="upload" @click="triggerAttach" :disabled="!props.enabled">⬆</button>
      <small v-if="attachments.length && props.enabled" class="hint">{{ attachments.length }} arquivo(s) selecionado(s)</small>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr; /* mobile-first */
  gap: 12px;
}
 .grid.disabled { opacity: .5; pointer-events: none; }
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
textarea {
  min-height: 96px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  background: #fff;
  color: #333;
  font-size: 16px;
  resize: vertical;
}

.file { grid-column: 1 / -1; align-items: flex-start; }

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

/* Tema fixo claro: sem variação por prefers-color-scheme */
</style>
