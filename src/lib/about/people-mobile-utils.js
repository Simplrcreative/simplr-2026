export function getPersonInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function getNameButtonFontClass(acfFont = '') {
  const font = String(acfFont).toLowerCase()

  if (font.includes('italic')) {
    return 'italic'
  }

  if (font.includes('serif') || font.includes('literata')) {
    return 'serif'
  }

  return 'sans'
}

export function getPeopleMobileSectionMinHeight(personCount = 0) {
  const listHeight = Math.max(personCount, 1) * 61
  return Math.max(listHeight + 740, 1200)
}
