<script setup>
import { onMounted } from 'vue'
import { useSideMenu } from '../composables/useSideMenu'
import { useRouter, useRoute } from 'vue-router'
import { checkGerenciamentoAccess, hasGerenciamentoAccess, isCheckingPermission, fetchCurrentUser } from '../services/user'

const { isOpen, close } = useSideMenu()
const router = useRouter()
const route = useRoute()

function go(path) {
  close()
  if (path) router.push(path)
}
function isActive(path) {
  return route.path === path
}

onMounted(async () => {
  // Garante usuário carregado e verifica permissão ao abrir o menu
  await fetchCurrentUser()
  await checkGerenciamentoAccess()
})
</script>

<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="isOpen" class="menu-overlay" @click="close"></div>
    </transition>
    <transition name="slide-menu">
      <nav v-if="isOpen" class="side-menu" aria-label="Menu lateral">
        <div class="profile">
          <div class="avatar">👤</div>
          <div class="info">
            <strong>Motorista</strong>
            <small>Ver perfil</small>
          </div>
        </div>
        <ul class="menu-list">
          <li class="group">Transporte</li>
          <li :class="{ active: isActive('/') }" @click="go('/')">Motorista</li>
          <li v-if="hasGerenciamentoAccess" :class="{ active: isActive('/gerenciamento') }" @click="go('/gerenciamento')">Gerenciamento</li>
          <li :class="{ active: isActive('/cadastrar') }" @click="go('/cadastrar')">Abastecimento</li>
        </ul>
        <div class="footer-links">
          <button @click="close" class="close-btn">Fechar</button>
        </div>
      </nav>
    </transition>
  </teleport>
</template>

<style scoped>
.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  backdrop-filter: blur(2px);
  z-index: 1000;
}
.side-menu {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 260px;
  background: #004b32;
  color: #fff;
  padding: 18px 16px 24px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
}
.profile { display:flex; gap:12px; align-items:center; margin-bottom:22px; }
.avatar { width:48px; height:48px; background:#0b5d3b; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; }
.info strong { display:block; font-size:14px; }
.info small { font-size:11px; opacity:.8; }
.menu-list { list-style:none; padding:0; margin:0; flex:1; overflow-y:auto; }
.menu-list li { padding:10px 8px; border-radius:8px; font-size:14px; cursor:pointer; }
.menu-list li:hover { background:rgba(255,255,255,.1); }
.menu-list li.group { font-size:11px; text-transform:uppercase; letter-spacing:.5px; opacity:.7; cursor:default; margin-top:4px; margin-bottom:4px; }
.menu-list li.active { background: rgba(255,255,255,.18); font-weight:600; }
.footer-links { margin-top:12px; }
.close-btn { width:100%; background:#0b5d3b; color:#fff; border:none; padding:12px 10px; border-radius:8px; font-weight:600; }

.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity:0; }
.slide-menu-enter-active, .slide-menu-leave-active { transition: transform .25s ease; }
.slide-menu-enter-from, .slide-menu-leave-to { transform: translateX(-100%); }
</style>
