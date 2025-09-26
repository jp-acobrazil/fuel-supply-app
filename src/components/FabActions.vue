<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchCurrentUser, getCurrentDriverId } from '../services/user'
const emit = defineEmits(['newChecklist', 'newAbastecimento', 'chat'])
const router = useRouter()

const expanded = ref(false)
function toggleExpand() {
    expanded.value = !expanded.value
}
function goToSupply() {
    expanded.value = false
    router.push({ name: 'supply' })
}

async function goToChecklist() {
    try {
        expanded.value = false
        await fetchCurrentUser()
        const driverId = getCurrentDriverId()
        if (!driverId) {
            console.warn('driverId não encontrado; abortando redirecionamento de checklist')
            return
        }
        const base = 'https://portal.acobrazil.com.br/checklist/checklists/3156'
        const url = `${base}/${encodeURIComponent(driverId)}`
        if (import.meta.env.DEV) {
            // Em desenvolvimento, abrir em nova aba para inspeção sem efeito colateral
            window.open(url, '_blank', 'noopener,noreferrer')
        } else {
            // Em produção, redirecionar na mesma aba
            window.location.href = url
        }
    } catch (e) {
        console.error('Falha ao redirecionar para checklist:', e)
    }
}
</script>

<template>
    <div class="fabs" :class="{ expanded }">
        <!-- Botões secundários quando expandido -->
        <transition name="fab-slide">
            <button v-if="expanded" class="fab small" aria-label="abastecimento" @click="goToSupply">⛽</button>
        </transition>
        <button class="fab primary" :aria-expanded="expanded" aria-label="abrir ações" @click="toggleExpand">+</button>
        <transition name="fab-slide">
            <button v-if="expanded" class="fab small" aria-label="checklist" @click="goToChecklist">📋</button>
        </transition>
    </div>

</template>

<style scoped>
.fabs {
    position: fixed;
    bottom: calc(24px + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    column-gap: 12px;
    pointer-events: none;
}

.fab {
    pointer-events: auto;
    width: 56px;
    height: 56px;
    border-radius: 999px;
    border: none;
    background: #fff;
    color: #0b5d3b;
    box-shadow: 0 4px 14px rgba(0, 0, 0, .18);
    font-size: 22px;
    display: grid;
    place-items: center;
    transition: transform .2s ease, opacity .2s ease, background-color .2s ease, box-shadow .2s ease;
}

.fab.small { width: 44px; height: 44px; font-size: 18px; background: #f3f4f6; }

.fab.primary {
    background: #0b5d3b;
    color: #fff;
    grid-column: 2; /* mantém o + centralizado mesmo sem ícones laterais */
    justify-self: center;
}

/* Rotação suave do botão "+" quando expandido */
.fabs.expanded .fab.primary { transform: rotate(45deg); }

/* Posicionamento lateral: primeiro small à esquerda, segundo à direita */
.fabs > .fab.small:first-of-type { justify-self: end; }
.fabs > .fab.small:last-of-type { justify-self: start; }

/* Transição de entrada/saída do botão de ação (⛽) */
/* Animação dos ícones laterais vindo do centro (slide + scale) */
.fab-slide-enter-from, .fab-slide-leave-to { opacity: 0; }
.fab-slide-enter-active, .fab-slide-leave-active { transition: opacity .2s ease, transform .2s ease; }

/* Esquerda: parte do centro (desloca da direita para a esquerda) */
.fabs > .fab.small:first-of-type.fab-slide-enter-from { transform: translateX(44px) scale(0.9); }
.fabs > .fab.small:first-of-type.fab-slide-leave-to   { transform: translateX(44px) scale(0.9); }

/* Direita: parte do centro (desloca da esquerda para a direita) */
.fabs > .fab.small:last-of-type.fab-slide-enter-from { transform: translateX(-44px) scale(0.9); }
.fabs > .fab.small:last-of-type.fab-slide-leave-to   { transform: translateX(-44px) scale(0.9); }
</style>
