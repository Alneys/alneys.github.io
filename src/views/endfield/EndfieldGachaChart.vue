<template>
  <div class="view-title">
    <h1>Endfield Gacha Info</h1>
  </div>
  <div class="al-divider"></div>
  <EndfieldGachaCharacterPanel />
  <div class="al-divider"></div>
  <EndfieldGachaWeaponPanel />
</template>

<script setup lang="ts">
import EndfieldGachaCharacterPanel from './components/EndfieldGachaCharacterPanel.vue';
import EndfieldGachaWeaponPanel from './components/EndfieldGachaWeaponPanel.vue';
</script>
