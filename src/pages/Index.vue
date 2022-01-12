<template>
  <q-page class="q-pa-md">
    <Player />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import Player from '@/components/player'
export default defineComponent({
  name: 'PageIndex',
  components: { Player }
})
</script>
