let zoomPreventionRegistered = false

export function preventZoom() {
  if (typeof document === 'undefined' || zoomPreventionRegistered) return

  zoomPreventionRegistered = true

  document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
      event.preventDefault()
    }
  }, { passive: false })

  let lastTouchEnd = 0
  document.addEventListener('touchend', (event) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, { passive: false })

  document.addEventListener('keydown', (event) => {
    if (
      (event.ctrlKey || event.metaKey)
      && (event.key === '+' || event.key === '-' || event.key === '=')
    ) {
      event.preventDefault()
    }
  })

  document.addEventListener('wheel', (event) => {
    if (event.ctrlKey) {
      event.preventDefault()
    }
  }, { passive: false })
}
