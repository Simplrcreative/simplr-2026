export const COMPACT_LOGO_BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
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
  logoScale: 0.40,
  logoY: -10,
  logoDuration: 0.5,
  taglineScale: 0.5,
  taglineY: -124,
  taglineX: 44,
}

const DESKTOP = {
  logoScale: 0.431,
  logoY: -10,
  logoDuration: 0.5,
  taglineScale: 0.621,
  taglineY: -176,
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
