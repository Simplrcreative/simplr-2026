import * as THREE from 'three'

const mediaCache = new Map()
const loadCallbacks = new Map()
const imageLoader = new THREE.TextureLoader()
imageLoader.setCrossOrigin('anonymous')

const isImageTextureLoaded = (tex) => {
  const img = tex.image
  return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0
}

const isVideoEntryReady = (entry) => {
  const video = entry?.video
  return video instanceof HTMLVideoElement && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
}

const isEntryReady = (entry) => {
  if (entry.type === 'video') return isVideoEntryReady(entry)
  return isImageTextureLoaded(entry.texture)
}

const notifyLoadCallbacks = (key, entry) => {
  loadCallbacks.get(key)?.forEach((cb) => {
    try {
      cb(entry.texture)
    } catch (err) {
      console.error('Media load callback failed:', err)
    }
  })
  loadCallbacks.delete(key)
}

const configureImageTexture = (texture) => {
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 4
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
}

const configureVideoTexture = (texture) => {
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.colorSpace = THREE.SRGBColorSpace
}

const loadImageTexture = (url) => {
  const texture = imageLoader.load(
    url,
    (tex) => {
      configureImageTexture(tex)
      const entry = mediaCache.get(url)
      if (entry) notifyLoadCallbacks(url, entry)
    },
    undefined,
    (err) => console.error('Texture load failed:', url, err)
  )

  return { type: 'image', texture, video: null }
}

const loadVideoTexture = (url) => {
  const video = document.createElement('video')
  // crossOrigin must be set before src or the browser fetches without CORS (WebGL needs it)
  video.crossOrigin = 'anonymous'
  video.muted = true
  video.defaultMuted = true
  video.loop = true
  video.playsInline = true
  video.preload = 'auto'
  video.setAttribute('playsinline', '')
  video.setAttribute('muted', '')
  video.setAttribute('crossorigin', 'anonymous')

  const texture = new THREE.VideoTexture(video)
  configureVideoTexture(texture)
  texture.userData.video = video

  const entry = { type: 'video', texture, video }

  const onReady = () => {
    texture.needsUpdate = true
    notifyLoadCallbacks(url, entry)
  }

  const onError = () => {
    console.error('Video load failed:', url, video.error)
    mediaCache.delete(url)
    loadCallbacks.delete(url)
  }

  video.addEventListener('loadeddata', onReady, { once: true })
  video.addEventListener('error', onError, { once: true })
  video.src = url

  return entry
}

export const getTexture = (item, onLoad) => {
  const key = item.url
  const existing = mediaCache.get(key)

  if (existing) {
    if (onLoad) {
      if (isEntryReady(existing)) {
        onLoad(existing.texture)
      } else {
        if (!loadCallbacks.has(key)) loadCallbacks.set(key, new Set())
        loadCallbacks.get(key).add(onLoad)
      }
    }
    return existing.texture
  }

  const callbacks = new Set()
  if (onLoad) callbacks.add(onLoad)
  loadCallbacks.set(key, callbacks)

  const entry = item.type === 'video' ? loadVideoTexture(key) : loadImageTexture(key)
  mediaCache.set(key, entry)
  return entry.texture
}

export const getVideoElement = (texture) => texture?.userData?.video ?? null

export function getMediaLoadProgress(items) {
  if (!items.length) return 100

  let ready = 0
  for (const item of items) {
    const entry = mediaCache.get(item.url)
    if (entry && isEntryReady(entry)) ready += 1
  }

  return Math.round((ready / items.length) * 100)
}

export function resetTextureManager() {
  loadCallbacks.clear()

  for (const entry of mediaCache.values()) {
    if (entry.type === 'video' && entry.video) {
      entry.video.pause()
      entry.video.removeAttribute('src')
      entry.video.load()
    }
    entry.texture?.dispose()
  }

  mediaCache.clear()
}
