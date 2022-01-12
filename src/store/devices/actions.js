export function updateDevices({ commit }, payload) {
  const audioinput = []
  const audiooutput = []
  const videoinput = []
  const videooutput = []
  payload.forEach((item) => {
    switch (item.kind) {
      case 'audioinput':
        audioinput.push(item)
        break
      case 'audiooutput':
        audiooutput.push(item)
        break
      case 'videoinput':
        videoinput.push(item)
        break
      case 'videooutput':
        videooutput.push(item)
        break
    }
  })
  commit('updateDetails', {
    audioinput: audioinput,
    audiooutput: audiooutput,
    videoinput: videoinput,
    videooutput: videooutput
  })
}
