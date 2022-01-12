export function updateDevices(state, payload) {
  state.devices = payload
}

export function updateDetails(state, payload) {
  state.audioinput = payload.audioinput
  state.audiooutput = payload.audiooutput
  state.videoinpout = payload.videoinpout
  state.videooutput = payload.videooutput
}

export function updateAudioinput(state, payload) {
  state.audioinput = payload
}

export function updateAudiooutput(state, payload) {
  state.audiooutput = payload
}

export function updateVideoinput(state, payload) {
  state.videoinpout = payload
}

export function updateVideooutput(state, payload) {
  state.videooutput = payload
}
