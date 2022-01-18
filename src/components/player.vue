<template>
  <q-card>
    <q-card-section>
      <div class="row justify-between items-center">
        <div class="q-gutter-x-sm row justify-start items-center">
          <span>
            <q-icon name="svguse:icons.svg#play-pc" size="sm" />
          </span>
          <span style="font-size: 1rem; font-weight: bold">
            PLAYER {{ id }}
          </span>
          <span>
            <q-icon
              :name="
                playStatus
                  ? 'svguse:icons.svg#play'
                  : 'svguse:icons.svg#stop'
              "
              :color="playStatus ? 'green' : 'red-10'"
              size="sm"
            />
          </span>
        </div>
        <div>
          <q-btn
            flat
            round
            icon="svguse:icons.svg#ban"
            color="red-10"
            size="sm"
          >
          </q-btn>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="q-gutter-y-sm">
        <q-select
          v-model="audioOutputDevice"
          dense
          filled
          :options="audiooutput"
          option-value="deviceId"
          label="Audio Device"
          emit-value
          map-options
          @update:model-value="fnUpdateDevice"
        >
          <template v-slot:after>
            <q-btn
              flat
              round
              icon="svguse:icons.svg#refresh"
              size="sm"
              @click="refreshDevices"
            >
              <q-tooltip>refresh</q-tooltip>
            </q-btn>
          </template>
        </q-select>
        <q-select
          v-model="chimeFile"
          dense
          filled
          :options="audioFileList"
          label="Chime Files"
          option-label="name"
          option-value="stream"
          emit-value
          map-options
          @update:model-value="fnUpdateChimeFile"
        >
          <template v-slot:after>
            <q-btn
              flat
              round
              icon="svguse:icons.svg#refresh"
              size="sm"
              @click="getAudioFiles"
            >
              <q-tooltip>refresh</q-tooltip>
            </q-btn>
          </template>
        </q-select>
      </div>
    </q-card-section>
  </q-card>
  <div v-show="false" class="q-mt-lg">
    <audio
      controls
      ref="audioplayer"
      @ended="fnOnEnded"
      @loadedmetadata="fnOnLoaded"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

export default {
  setup() {
    const { state, dispatch } = useStore()
    const audioplayer = ref(null)

    const id = ref('1')
    const playStatus = ref(false)
    const devices = computed(() => state.devices.devices)
    const audiooutput = computed(() => state.devices.audiooutput)
    const audioOutputDevice = ref(null)
    const audioFileList = ref([])
    const chimeFile = ref(null)

    const broadcast = ref(null)

    const playlist = ref([])
    const playId = ref(0)

    const refreshDevices = async () => {
      dispatch(
        'devices/updateDevices',
        await navigator.mediaDevices.enumerateDevices({
          audio: true,
          video: true
        })
      )
    }

    const getAudioFiles = async () => {
      const r = await axios.get(
        'http://localhost:3000/api/files/getSound'
      )
      audioFileList.value = r.data
      console.log(r.data)
    }

    const fnUpdateChimeFile = () => {
      window.data.onRequest({
        key: 'set_chime',
        id: id.value,
        value: chimeFile.value
      })
    }

    const fnUpdateDevice = () => {
      window.data.onRequest({
        key: 'set_audiooutput',
        id: id.value,
        value: audioOutputDevice.value
      })

      audioplayer.value.setSinkId(audioOutputDevice.value)
    }

    const fnOnEnded = async () => {
      console.log(playlist.value.length, playId.value)
      if (playlist.value.length === playId.value + 1) {
        console.log('end')
        audioplayer.value.src = ''
        playlist.value = []
        playId.value = 0

        window.data.onRequest({
          key: 'onEnded',
          value: JSON.stringify(broadcast.value)
        })
        // try {
        //   const r = await axios.post(
        //     'http://localhost:3000/api/broadcast/onended',
        //     { ...broadcast.value }
        //   )
        // } catch (e) {
        //   console.error(e)
        // }
      } else {
        playId.value += 1
        audioplayer.value.src = playlist.value[playId.value]
      }
    }

    const fnOnLoaded = () => {
      audioplayer.value.play()
      console.log('on loadedmetadata')
    }

    const play = () => {
      if (playlist.value && playlist.value.length) {
        audioplayer.value.src = playlist.value[playId.value]
      }
    }

    const stop = () => {
      audioplayer.value.pause()
      audioplayer.value.src = ''
      playlist.value = []
      playId.value = 0
    }

    onMounted(async () => {
      refreshDevices()
      getAudioFiles()
      window.data.onRequest({ key: 'get_chime', id: id.value })
      window.data.onRequest({ key: 'get_audiooutput', id: id.value })

      window.data.onResponse((args) => {
        switch (args.key) {
          case 'chime':
            chimeFile.value = args.value
            break
          case 'audiooutput':
            if (args.value) {
              audioOutputDevice.value = args.value
              audioplayer.value.setSinkId(args.value)
            } else {
              audioOutputDevice.value = 'default'
            }
            break
          case 'onair':
            broadcast.value = args
            if (args.startChime) {
              console.log('startchime')
              playlist.value.push(
                `http://localhost:3000/files/${chimeFile.value}`
              )
            }
            playlist.value.push(
              `http://localhost:3000/files/${args.file.stream}`
            )
            // play
            play()
            break
          case 'offair':
            stop()
            break
          default:
            console.log(args)
            break
        }
      })
    })

    return {
      audioplayer,
      id,
      playStatus,
      devices,
      audiooutput,
      audioFileList,
      audioOutputDevice,
      chimeFile,
      refreshDevices,
      getAudioFiles,
      fnUpdateChimeFile,
      fnUpdateDevice,
      fnOnEnded,
      fnOnLoaded
    }
  }
}
</script>
