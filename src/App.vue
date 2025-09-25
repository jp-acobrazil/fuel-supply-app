<script setup>
// App shell usa o router-view e inclui side menu global
import SideMenu from './components/SideMenu.vue'
</script>

<template>
  <router-view />
  <SideMenu />
  
</template>

<style scoped>
/* escopo vazio: estilos principais ficam em style.css */
</style>
