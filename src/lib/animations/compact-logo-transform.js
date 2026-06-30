export const COMPACT_LOGO_BREAKPOINTS = {
  tablet: 768,
  desktop: 1280,
}

const MOBILE = {
  logoScale: 1,
  logoY: 0,
  logoDuration: 0,
  taglineScale: 0.66,
  taglineY: -88,
  taglineX: 65,
}

const TABLET = {
  logoScale: 0.65,
  logoY: -10,
  logoDuration: 0.5,
  taglineScale: 0.6,
  taglineY: -125,
  taglineX: 60,
}

const DESKTOP = {
  logoScale: 0.35,
  logoY: -10,
  logoDuration: 0.5,
  taglineScale: 0.55,
  taglineY: -178,
  taglineX: 65,
}

export function getCompactLogoTransform(width = window.innerWidth) {
  if (width >= COMPACT_LOGO_BREAKPOINTS.desktop) return DESKTOP
  if (width >= COMPACT_LOGO_BREAKPOINTS.tablet) return TABLET
  return MOBILE
}

export function isCompactLogoTabletUp(width = window.innerWidth) {
  return width >= COMPACT_LOGO_BREAKPOINTS.tablet
}
