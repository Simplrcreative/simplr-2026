let activeMobileVideo = null

export function requestMobileServiceVideoPlay(video) {
  if (!video) return Promise.resolve()

  if (activeMobileVideo && activeMobileVideo !== video) {
    activeMobileVideo.pause()
  }

  activeMobileVideo = video
  return video.play().catch(() => undefined)
}

export function releaseMobileServiceVideo(video) {
  if (!video) return

  if (activeMobileVideo === video) {
    activeMobileVideo = null
  }

  video.pause()
}
