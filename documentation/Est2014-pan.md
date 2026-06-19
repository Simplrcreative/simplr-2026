# Est2014-pan — WebGL Free-Pan Gallery

A full-viewport WebGL gallery where the user drags to explore an oversized image grid in any direction.
Images distort with a wave shader proportional to pan velocity — the harder you drag, the more they warp.

Intended to eventually replace `Est2014Page.jsx`.

---

## 1. Install Three.js first

```bash
cd /Users/darylglass/Sites/simplr-2026
npm install three
```

GSAP and Lenis are already in the project.

---

## 2. How to run it

Add it to your router in the same way as `Est2014Page.jsx`.
Example (React Router v6):

```jsx
import Est2014Pan from './routes/Est2014-pan.jsx'

// In your routes array:
{ path: '/est2014-pan', element: <Est2014Pan /> }
```

Then visit `/est2014-pan` in the browser.

---

## 3. Swapping in real images

Currently uses Lorem Picsum placeholders. To hook up real data:

```jsx
// Top of Est2014-pan.jsx — replace PLACEHOLDER_IMAGES:
const PLACEHOLDER_IMAGES = Array.from({ length: COLS * ROWS }, (_, i) =>
  `https://picsum.photos/seed/${100 + i}/840/1120`
)
```

**With `useLoaderData` (matching the existing Est2014Page pattern):**

```jsx
import { useLoaderData } from 'react-router-dom'

export default function Est2014Pan() {
  const { beyondItems = [] } = useLoaderData() ?? {}

  // Map beyondItems to URL strings — adjust to match your data shape
  const images = beyondItems.map((item) =>
    item.acfFeaturedThumbnail?.node?.mediaDetails?.sizes
      ?.find((s) => s.name === 'large')?.sourceUrl ?? ''
  ).filter(Boolean)

  // Pass `images` into the useEffect via a ref or restructure
  // the effect to read from state.
  ...
}
```

Because the Three.js setup runs in a `useEffect`, the cleanest pattern is to
store the image array in a `useRef` and read it inside the effect:

```jsx
const imagesRef = useRef(images)

useEffect(() => {
  const images = imagesRef.current
  // ... rest of Three.js setup using `images` instead of PLACEHOLDER_IMAGES
}, [])
```

---

## 4. Tweakable config (top of file)

| Constant   | Default | Effect                          |
|------------|---------|---------------------------------|
| `COLS`     | 5       | Number of columns in the grid   |
| `ROWS`     | 4       | Number of rows                  |
| `IMG_W`    | 420     | Plane width in px               |
| `IMG_H`    | 560     | Plane height in px              |
| `GAP`      | 32      | Gap between images in px        |
| `BG_COLOR` | `0x0a0a0a` | Canvas background colour     |

---

## 5. Shader tweaks

In the fragment shader (`fragmentShader` string):

| Uniform / value        | What it controls                                |
|------------------------|-------------------------------------------------|
| `* 7.0` (frequency)    | Wave frequency — higher = tighter ripples       |
| `* 0.035` (amplitude)  | Max distortion amount — increase for more warp  |
| `* 1.5` (time speed)   | How fast the wave animates at rest              |
| `uReveal`              | 0→1 intro clip (slides up from bottom per image)|

**To make distortion stronger:**
```glsl
float waveX = sin(uv.y * 7.0 + uTime * 1.5) * uVelocityX * 0.08; // was 0.035
float waveY = sin(uv.x * 7.0 + uTime * 1.5) * uVelocityY * 0.08;
```

---

## 6. Pan feel tweaks

In the render loop (`tick` function):

```js
pan.x += (targetPan.x - pan.x) * 0.075   // lower = more lag/smoothness
velocity.x += (rawVel.x * 0.15 - velocity.x) * 0.12  // lower = slower velocity decay
```

---

## 7. Replacing Est2014Page.jsx

When ready to go live:

1. Confirm the route path in the router
2. Wire up `useLoaderData` using the pattern in section 3
3. Rename `Est2014Page.jsx` → `Est2014Page-masonry-backup.jsx` (keep for safety)
4. Rename `Est2014-pan.jsx` → `Est2014Page.jsx`
5. Remove the placeholder constant and the `imagesRef` workaround if data loads synchronously

---

## 8. Known limitations / next steps

- **No hover effect** — hovering an image could scale it up or show a title overlay
- **No click/navigation** — clicking an image could open the work detail page
- **No cursor indicator** — a custom cursor showing drag direction would be a nice touch
- **Momentum on release** — currently velocity decays to 0; could add post-drag momentum using GSAP inertia plugin
- **Mobile** — touch events wired up, but test on real devices
