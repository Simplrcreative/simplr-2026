import { KeyboardControls, Stats, useKeyboardControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { useIsTouchDevice } from '../lib/use-is-touch-device.js'
import { clamp, lerp } from '../lib/infinite-canvas-utils.js'
import {
  CHUNK_FADE_MARGIN,
  CHUNK_OFFSETS,
  CHUNK_SIZE,
  DEPTH_FADE_END,
  DEPTH_FADE_START,
  INITIAL_CAMERA_Z,
  INVIS_THRESHOLD,
  KEYBOARD_SPEED,
  MAX_VELOCITY,
  RENDER_DISTANCE,
  VELOCITY_DECAY,
  VELOCITY_LERP,
} from './constants.js'
import styles from './style.module.css'
import { getTexture, getVideoElement, getMediaLoadProgress } from './texture-manager.js'
import { generateChunkPlanesCached, getChunkUpdateThrottleMs, shouldThrottleUpdate } from './utils.js'

const PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1)
const PAGE_TRANSITION_PREPARE_CAPTURE_EVENT = 'page-transition:prepare-capture'
const PAGE_TRANSITION_COMPLETE_EVENT = 'page-transition:complete'
const INFINITE_CANVAS_RESIZE_EVENT = 'infinite-canvas:resize'

function getCanvasContainer(canvas) {
  return canvas.parentElement?.parentElement ?? canvas.parentElement
}

function TransitionCaptureSync() {
  const { gl, scene, camera } = useThree()

  React.useEffect(() => {
    const onPrepareCapture = () => {
      gl.render(scene, camera)
      gl.finish()
    }

    window.addEventListener(PAGE_TRANSITION_PREPARE_CAPTURE_EVENT, onPrepareCapture)
    return () => window.removeEventListener(PAGE_TRANSITION_PREPARE_CAPTURE_EVENT, onPrepareCapture)
  }, [gl, scene, camera])

  return null
}

function CanvasResizeSync() {
  const gl = useThree((state) => state.gl)
  const setSize = useThree((state) => state.setSize)

  const syncSize = React.useCallback(() => {
    const container = getCanvasContainer(gl.domElement)
    if (!container) return

    const { width, height } = container.getBoundingClientRect()
    if (width <= 0 || height <= 0) return

    setSize(Math.round(width), Math.round(height))
  }, [gl, setSize])

  React.useLayoutEffect(() => {
    syncSize()

    const raf1 = requestAnimationFrame(syncSize)
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(syncSize))

    window.addEventListener('resize', syncSize)
    window.addEventListener(PAGE_TRANSITION_COMPLETE_EVENT, syncSize)
    window.addEventListener(INFINITE_CANVAS_RESIZE_EVENT, syncSize)

    const container = getCanvasContainer(gl.domElement)
    const observer = container ? new ResizeObserver(syncSize) : null
    observer?.observe(container)

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      window.removeEventListener('resize', syncSize)
      window.removeEventListener(PAGE_TRANSITION_COMPLETE_EVENT, syncSize)
      window.removeEventListener(INFINITE_CANVAS_RESIZE_EVENT, syncSize)
      observer?.disconnect()
    }
  }, [gl, syncSize])

  return null
}

const KEYBOARD_MAP = [
  { name: 'forward', keys: ['w', 'W', 'ArrowUp'] },
  { name: 'backward', keys: ['s', 'S', 'ArrowDown'] },
  { name: 'left', keys: ['a', 'A', 'ArrowLeft'] },
  { name: 'right', keys: ['d', 'D', 'ArrowRight'] },
  { name: 'up', keys: ['e', 'E'] },
  { name: 'down', keys: ['q', 'Q'] },
]

const getTouchDistance = (touches) => {
  if (touches.length < 2) return 0
  const [t1, t2] = touches
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function MediaPlane({ position, scale, media, chunkCx, chunkCy, chunkCz, cameraGridRef }) {
  const meshRef = React.useRef(null)
  const materialRef = React.useRef(null)
  const localState = React.useRef({ opacity: 0, frame: 0, ready: false })

  const [texture, setTexture] = React.useState(null)
  const [isReady, setIsReady] = React.useState(false)

  useFrame(() => {
    const material = materialRef.current
    const mesh = meshRef.current
    const state = localState.current

    if (!material || !mesh) return

    state.frame = (state.frame + 1) & 1

    if (state.opacity < INVIS_THRESHOLD && !mesh.visible && state.frame === 0) return

    const cam = cameraGridRef.current
    const dist = Math.max(Math.abs(chunkCx - cam.cx), Math.abs(chunkCy - cam.cy), Math.abs(chunkCz - cam.cz))
    const absDepth = Math.abs(position.z - cam.camZ)

    if (absDepth > DEPTH_FADE_END + 50) {
      state.opacity = 0
      material.opacity = 0
      material.depthWrite = false
      mesh.visible = false
      return
    }

    const gridFade =
      dist <= RENDER_DISTANCE ? 1 : Math.max(0, 1 - (dist - RENDER_DISTANCE) / Math.max(CHUNK_FADE_MARGIN, 0.0001))

    const depthFade =
      absDepth <= DEPTH_FADE_START
        ? 1
        : Math.max(0, 1 - (absDepth - DEPTH_FADE_START) / Math.max(DEPTH_FADE_END - DEPTH_FADE_START, 0.0001))

    const target = Math.min(gridFade, depthFade * depthFade)

    if (state.opacity < INVIS_THRESHOLD && target > 0.5) {
      state.opacity = target
    } else {
      state.opacity = target < INVIS_THRESHOLD && state.opacity < INVIS_THRESHOLD ? 0 : lerp(state.opacity, target, 0.18)
    }

    const isFullyOpaque = state.opacity > 0.99
    material.opacity = isFullyOpaque ? 1 : state.opacity
    material.depthWrite = isFullyOpaque
    mesh.visible = state.opacity > INVIS_THRESHOLD

    const video = getVideoElement(material.map)
    if (video) {
      const shouldPlay = mesh.visible && state.opacity > 0.15
      if (shouldPlay && video.paused) {
        video.play().catch(() => {})
      }
      if (!video.paused) {
        material.map.needsUpdate = true
      }
    }
  })

  const displayScale = React.useMemo(() => {
    if (media.width && media.height) {
      const aspect = media.width / media.height
      return new THREE.Vector3(scale.y * aspect, scale.y, 1)
    }
    return scale
  }, [media.width, media.height, scale])

  React.useEffect(() => {
    const state = localState.current
    state.ready = false
    state.opacity = 0
    setIsReady(false)

    const material = materialRef.current
    if (material) {
      material.opacity = 0
      material.depthWrite = false
      material.map = null
    }

    const tex = getTexture(media, () => {
      state.ready = true
      setIsReady(true)
    })

    setTexture(tex)
  }, [media])

  React.useEffect(() => {
    const material = materialRef.current
    const mesh = meshRef.current
    const state = localState.current

    if (!material || !mesh || !texture || !isReady || !state.ready) return

    material.map = texture
    material.opacity = state.opacity
    material.depthWrite = state.opacity >= 1
    mesh.scale.copy(displayScale)
  }, [displayScale, texture, isReady])

  if (!texture || !isReady) return null

  return (
    <mesh ref={meshRef} position={position} scale={displayScale} visible={false} geometry={PLANE_GEOMETRY}>
      <meshBasicMaterial ref={materialRef} transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Chunk({ cx, cy, cz, media, cameraGridRef }) {
  const [planes, setPlanes] = React.useState(() => generateChunkPlanesCached(cx, cy, cz))

  React.useEffect(() => {
    setPlanes(generateChunkPlanesCached(cx, cy, cz))
  }, [cx, cy, cz])

  if (!planes) return null

  return (
    <group>
      {planes.map((plane) => {
        const mediaItem = media[plane.mediaIndex % media.length]
        if (!mediaItem) return null

        return (
          <MediaPlane
            key={plane.id}
            position={plane.position}
            scale={plane.scale}
            media={mediaItem}
            chunkCx={cx}
            chunkCy={cy}
            chunkCz={cz}
            cameraGridRef={cameraGridRef}
          />
        )
      })}
    </group>
  )
}

function buildChunksForCamera(camera) {
  const cx = Math.floor(camera.x / CHUNK_SIZE)
  const cy = Math.floor(camera.y / CHUNK_SIZE)
  const cz = Math.floor(camera.z / CHUNK_SIZE)

  return CHUNK_OFFSETS.map((o) => ({
    key: `${cx + o.dx},${cy + o.dy},${cz + o.dz}`,
    cx: cx + o.dx,
    cy: cy + o.dy,
    cz: cz + o.dz,
  }))
}

const createInitialState = (camZ) => ({
  velocity: { x: 0, y: 0, z: 0 },
  targetVel: { x: 0, y: 0, z: 0 },
  basePos: { x: 0, y: 0, z: camZ },
  drift: { x: 0, y: 0 },
  mouse: { x: 0, y: 0 },
  lastMouse: { x: 0, y: 0 },
  scrollAccum: 0,
  isDragging: false,
  lastTouches: [],
  lastTouchDist: 0,
  lastChunkKey: '',
  lastChunkUpdate: 0,
  pendingChunk: null,
})

function SceneController({ media, onTextureProgress }) {
  const { camera, gl } = useThree()
  const isTouchDevice = useIsTouchDevice()
  const [, getKeys] = useKeyboardControls()

  const state = React.useRef(createInitialState(INITIAL_CAMERA_Z))
  const cameraGridRef = React.useRef({ cx: 0, cy: 0, cz: 0, camZ: camera.position.z })

  const [chunks, setChunks] = React.useState(() =>
    buildChunksForCamera({ x: camera.position.x, y: camera.position.y, z: camera.position.z })
  )

  const maxProgress = React.useRef(0)

  React.useEffect(() => {
    maxProgress.current = 0
    media.forEach((item) => getTexture(item))
    buildChunksForCamera({ x: 0, y: 0, z: INITIAL_CAMERA_Z }).forEach((chunk) => {
      generateChunkPlanesCached(chunk.cx, chunk.cy, chunk.cz)
    })
  }, [media])

  React.useEffect(() => {
    if (!media.length) {
      onTextureProgress?.(100)
      return undefined
    }

    const update = () => {
      const progress = getMediaLoadProgress(media)
      if (progress > maxProgress.current) {
        maxProgress.current = progress
        onTextureProgress?.(progress)
      }
    }

    update()
    const id = window.setInterval(update, 100)
    return () => window.clearInterval(id)
  }, [media, onTextureProgress])

  React.useEffect(() => {
    const canvas = gl.domElement
    const s = state.current
    canvas.style.cursor = 'grab'

    const setCursor = (cursor) => { canvas.style.cursor = cursor }

    const onMouseDown = (e) => {
      s.isDragging = true
      s.lastMouse = { x: e.clientX, y: e.clientY }
      setCursor('grabbing')
    }

    const onMouseUp = () => {
      s.isDragging = false
      setCursor('grab')
    }

    const onMouseLeave = () => {
      s.mouse = { x: 0, y: 0 }
      s.isDragging = false
      setCursor('grab')
    }

    const onMouseMove = (e) => {
      s.mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      }
      if (s.isDragging) {
        s.targetVel.x -= (e.clientX - s.lastMouse.x) * 0.025
        s.targetVel.y += (e.clientY - s.lastMouse.y) * 0.025
        s.lastMouse = { x: e.clientX, y: e.clientY }
      }
    }

    const onWheel = (e) => {
      e.preventDefault()
      s.scrollAccum += e.deltaY * 0.006
    }

    const onTouchStart = (e) => {
      e.preventDefault()
      s.lastTouches = Array.from(e.touches)
      s.lastTouchDist = getTouchDistance(s.lastTouches)
      setCursor('grabbing')
    }

    const onTouchMove = (e) => {
      e.preventDefault()
      const touches = Array.from(e.touches)

      if (touches.length === 1 && s.lastTouches.length >= 1) {
        const [touch] = touches
        const [last] = s.lastTouches
        if (touch && last) {
          s.targetVel.x -= (touch.clientX - last.clientX) * 0.02
          s.targetVel.y += (touch.clientY - last.clientY) * 0.02
        }
      } else if (touches.length === 2 && s.lastTouchDist > 0) {
        const dist = getTouchDistance(touches)
        s.scrollAccum += (s.lastTouchDist - dist) * 0.006
        s.lastTouchDist = dist
      }

      s.lastTouches = touches
    }

    const onTouchEnd = (e) => {
      s.lastTouches = Array.from(e.touches)
      s.lastTouchDist = getTouchDistance(s.lastTouches)
      setCursor('grab')
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [gl])

  useFrame(() => {
    const s = state.current
    const now = performance.now()

    const { forward, backward, left, right, up, down } = getKeys()
    if (forward) s.targetVel.z -= KEYBOARD_SPEED
    if (backward) s.targetVel.z += KEYBOARD_SPEED
    if (left) s.targetVel.x -= KEYBOARD_SPEED
    if (right) s.targetVel.x += KEYBOARD_SPEED
    if (down) s.targetVel.y -= KEYBOARD_SPEED
    if (up) s.targetVel.y += KEYBOARD_SPEED

    const isZooming = Math.abs(s.velocity.z) > 0.05
    const zoomFactor = clamp(s.basePos.z / 50, 0.3, 2.0)
    const driftAmount = 8.0 * zoomFactor
    const driftLerp = isZooming ? 0.2 : 0.12

    if (s.isDragging) {
      // freeze drift during drag
    } else if (isTouchDevice) {
      s.drift.x = lerp(s.drift.x, 0, driftLerp)
      s.drift.y = lerp(s.drift.y, 0, driftLerp)
    } else {
      s.drift.x = lerp(s.drift.x, s.mouse.x * driftAmount, driftLerp)
      s.drift.y = lerp(s.drift.y, s.mouse.y * driftAmount, driftLerp)
    }

    s.targetVel.z += s.scrollAccum
    s.scrollAccum *= 0.8

    s.targetVel.x = clamp(s.targetVel.x, -MAX_VELOCITY, MAX_VELOCITY)
    s.targetVel.y = clamp(s.targetVel.y, -MAX_VELOCITY, MAX_VELOCITY)
    s.targetVel.z = clamp(s.targetVel.z, -MAX_VELOCITY, MAX_VELOCITY)

    s.velocity.x = lerp(s.velocity.x, s.targetVel.x, VELOCITY_LERP)
    s.velocity.y = lerp(s.velocity.y, s.targetVel.y, VELOCITY_LERP)
    s.velocity.z = lerp(s.velocity.z, s.targetVel.z, VELOCITY_LERP)

    s.basePos.x += s.velocity.x
    s.basePos.y += s.velocity.y
    s.basePos.z += s.velocity.z

    camera.position.set(s.basePos.x + s.drift.x, s.basePos.y + s.drift.y, s.basePos.z)

    s.targetVel.x *= VELOCITY_DECAY
    s.targetVel.y *= VELOCITY_DECAY
    s.targetVel.z *= VELOCITY_DECAY

    const cx = Math.floor(s.basePos.x / CHUNK_SIZE)
    const cy = Math.floor(s.basePos.y / CHUNK_SIZE)
    const cz = Math.floor(s.basePos.z / CHUNK_SIZE)

    cameraGridRef.current = { cx, cy, cz, camZ: s.basePos.z }

    const key = `${cx},${cy},${cz}`
    if (key !== s.lastChunkKey) {
      s.pendingChunk = { cx, cy, cz }
      s.lastChunkKey = key
    }

    const throttleMs = getChunkUpdateThrottleMs(isZooming, Math.abs(s.velocity.z))

    if (s.pendingChunk && shouldThrottleUpdate(s.lastChunkUpdate, throttleMs, now)) {
      const { cx: ucx, cy: ucy, cz: ucz } = s.pendingChunk
      s.pendingChunk = null
      s.lastChunkUpdate = now

      setChunks(buildChunksForCamera(s.basePos))
    }
  })

  React.useEffect(() => {
    const s = state.current
    s.basePos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    setChunks(buildChunksForCamera(camera.position))
  }, [camera])

  return (
    <>
      {chunks.map((chunk) => (
        <Chunk key={chunk.key} cx={chunk.cx} cy={chunk.cy} cz={chunk.cz} media={media} cameraGridRef={cameraGridRef} />
      ))}
    </>
  )
}

export function InfiniteCanvasScene({
  media,
  onTextureProgress,
  showFps = false,
  showControls = false,
  cameraFov = 60,
  cameraNear = 1,
  cameraFar = 500,
  fogNear = 120,
  fogFar = 320,
  backgroundColor = '#0a0a0a',
  fogColor = '#0a0a0a',
}) {
  const isTouchDevice = useIsTouchDevice()
  const dpr = Math.min(window.devicePixelRatio || 1, isTouchDevice ? 1.25 : 1.5)

  if (!media.length) return null

  return (
    <KeyboardControls map={KEYBOARD_MAP}>
      <div className={styles.container}>
        <Canvas
          camera={{ position: [0, 0, INITIAL_CAMERA_Z], fov: cameraFov, near: cameraNear, far: cameraFar }}
          dpr={dpr}
          flat
          gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
          className={`${styles.canvas} transition-capture-canvas`}
          onCreated={({ gl: renderer, setSize }) => {
            renderer.domElement.classList.add('transition-capture-canvas')
            requestAnimationFrame(() => {
              const container = getCanvasContainer(renderer.domElement)
              if (!container) return
              const { width, height } = container.getBoundingClientRect()
              if (width <= 0 || height <= 0) return
              setSize(Math.round(width), Math.round(height))
              window.dispatchEvent(new Event(INFINITE_CANVAS_RESIZE_EVENT))
            })
          }}
        >
          <TransitionCaptureSync />
          <CanvasResizeSync />
          <color attach="background" args={[backgroundColor]} />
          <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
          <SceneController media={media} onTextureProgress={onTextureProgress} />
          {showFps && <Stats className={styles.stats} />}
        </Canvas>

        {showControls && (
          <div className={styles.controlsPanel}>
            {isTouchDevice ? (
              <><b>Drag</b> Pan · <b>Pinch</b> Zoom</>
            ) : (
              <><b>WASD</b> Move · <b>QE</b> Up/Down · <b>Scroll</b> Zoom</>
            )}
          </div>
        )}
      </div>
    </KeyboardControls>
  )
}
