import { useCallback } from 'react'

type ResizeHandleProps = {
  axis: 'x' | 'y'
  onResize: (deltaPx: number) => void
  onReset?: () => void
  ariaLabel: string
}

export default function ResizeHandle({ axis, onResize, onReset, ariaLabel }: ResizeHandleProps) {
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const target = e.currentTarget
      target.setPointerCapture(e.pointerId)
      target.classList.add('resize-handle--active')
      document.body.classList.add('is-resizing')

      let last = axis === 'x' ? e.clientX : e.clientY

      const move = (ev: PointerEvent) => {
        const curr = axis === 'x' ? ev.clientX : ev.clientY
        const delta = curr - last
        if (delta !== 0) {
          last = curr
          onResize(delta)
        }
      }

      const up = () => {
        target.classList.remove('resize-handle--active')
        document.body.classList.remove('is-resizing')
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
      }

      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [axis, onResize],
  )

  return (
    <div
      className={`resize-handle resize-handle--${axis}`}
      onPointerDown={handlePointerDown}
      onDoubleClick={onReset}
      role="separator"
      aria-orientation={axis === 'x' ? 'vertical' : 'horizontal'}
      aria-label={ariaLabel}
      title="Drag to resize · double-click to reset"
    />
  )
}
