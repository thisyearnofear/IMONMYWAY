'use client'

import { useEffect, useRef } from 'react'

interface ClockFaceProps {
  size?: number
  className?: string
  showSeconds?: boolean
  accentColor?: string
  trackColor?: string
  handColor?: string
}

export function ClockFace({
  size = 400,
  className = '',
  showSeconds = true,
  accentColor = '#EAC46C',
  trackColor = 'rgba(255, 255, 255, 0.08)',
  handColor = 'rgba(255, 255, 255, 0.9)',
}: ClockFaceProps) {
  const hourRef = useRef<SVGLineElement>(null)
  const minuteRef = useRef<SVGLineElement>(null)
  const secondRef = useRef<SVGLineElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const ms = now.getMilliseconds()
      const s = now.getSeconds() + ms / 1000
      const m = now.getMinutes() + s / 60
      const h = (now.getHours() % 12) + m / 60

      const hourAngle = h * 30
      const minuteAngle = m * 6
      const secondAngle = s * 6

      if (hourRef.current) hourRef.current.style.transform = `rotate(${hourAngle}deg)`
      if (minuteRef.current) minuteRef.current.style.transform = `rotate(${minuteAngle}deg)`
      if (secondRef.current) secondRef.current.style.transform = `rotate(${secondAngle}deg)`

      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 20

  const hourTicks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180)
    const innerR = r - 16
    const outerR = r - 4
    return {
      x1: cx + innerR * Math.cos(angle),
      y1: cy + innerR * Math.sin(angle),
      x2: cx + outerR * Math.cos(angle),
      y2: cy + outerR * Math.sin(angle),
      isMajor: true,
    }
  })

  const minuteTicks = Array.from({ length: 60 }, (_, i) => {
    if (i % 5 === 0) return null
    const angle = (i * 6 - 90) * (Math.PI / 180)
    const innerR = r - 8
    const outerR = r - 4
    return {
      x1: cx + innerR * Math.cos(angle),
      y1: cy + innerR * Math.sin(angle),
      x2: cx + outerR * Math.cos(angle),
      y2: cy + outerR * Math.sin(angle),
    }
  }).filter(Boolean)

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Animated clock face showing current time"
    >
      <defs>
        <radialGradient id="clock-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="85%" stopColor="rgba(255,255,255,0.01)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke={trackColor} strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r} fill="url(#clock-bg)" stroke={trackColor} strokeWidth="0.5" />

      {/* Minute ticks */}
      {minuteTicks.map((tick, i) => (
        <line
          key={`min-${i}`}
          x1={tick!.x1}
          y1={tick!.y1}
          x2={tick!.x2}
          y2={tick!.y2}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.75"
        />
      ))}

      {/* Hour ticks */}
      {hourTicks.map((tick, i) => (
        <line
          key={`hr-${i}`}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ))}

      {/* Hour hand */}
      <line
        ref={hourRef}
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - r * 0.5}
        stroke={handColor}
        strokeWidth="4"
        strokeLinecap="round"
        style={{ transformOrigin: `${cx}px ${cy}px`, transition: 'none' }}
      />

      {/* Minute hand */}
      <line
        ref={minuteRef}
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - r * 0.72}
        stroke={handColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ transformOrigin: `${cx}px ${cy}px`, transition: 'none' }}
      />

      {/* Second hand */}
      {showSeconds && (
        <g ref={secondRef} style={{ transformOrigin: `${cx}px ${cy}px`, transition: 'none' }}>
          <line
            x1={cx}
            y1={cy + 20}
            x2={cx}
            y2={cy - r * 0.85}
            stroke={accentColor}
            strokeWidth="1"
            filter="url(#glow)"
          />
          <circle cx={cx} cy={cy - r * 0.85} r="2" fill={accentColor} />
        </g>
      )}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="5" fill={accentColor} />
      <circle cx={cx} cy={cy} r="2.5" fill="#17171a" />
    </svg>
  )
}
