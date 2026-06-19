import { clearPlaneCache } from './utils.js'
import { resetTextureManager } from './texture-manager.js'

export function resetInfiniteCanvas() {
  clearPlaneCache()
  resetTextureManager()
}
