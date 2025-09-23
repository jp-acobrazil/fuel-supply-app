<script setup>
import { useRouter } from 'vue-router'
const emit = defineEmits(['newChecklist', 'newAbastecimento', 'chat'])
const router = useRouter()
function goToSupply() { router.push({ name: 'supply' }) }
</script>

<template>
  <div class="fabs">
    <button class="fab small" aria-label="checklist" @click="emit('newChecklist')">✔</button>
    <button class="fab small" aria-label="pagamentos" @click="emit('newAbastecimento')">$</button>
    <button class="fab small" aria-label="chat" @click="emit('chat')">💬</button>
  <button class="fab primary" aria-label="criar" @click="goToSupply">+</button>
  </div>
  
</template>

<style scoped>
.fabs { position: fixed; bottom: calc(24px + env(safe-area-inset-bottom)); left: 0; right: 0; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; align-items: end; justify-items: center; pointer-events: none; }
.fab { pointer-events: auto; width: 56px; height: 56px; border-radius: 999px; border: none; background: #fff; color: #0b5d3b; box-shadow: 0 4px 14px rgba(0,0,0,.18); font-size: 22px; display: grid; place-items: center; }
.fab.small { width: 44px; height: 44px; font-size: 18px; background: #f3f4f6; }
.fab.primary { background: #0b5d3b; color: #fff; }
</style>
