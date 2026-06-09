'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DialStep {
  number: string
  title: string
  description: string
}

interface AgentDialProps {
  steps: DialStep[]
  className?: string
}

export function AgentDial({ steps, className = '' }: AgentDialProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [needleAngle, setNeedleAngle] = useState(0)

  const anglePerStep = 360 / steps.length

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const rect = container.getBoundingClientRect()
      const viewHeight = window.innerHeight
      const sectionTop = rect.top
      const sectionHeight = rect.height

      const progress = Math.max(0, Math.min(1, (viewHeight - sectionTop) / (viewHeight + sectionHeight)))
      const stepIndex = Math.min(steps.length - 1, Math.floor(progress * steps.length))
      const angle = stepIndex * anglePerStep

      setActiveStep(stepIndex)
      setNeedleAngle(angle)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [steps.length, anglePerStep])

  const dialSize = 320
  const cx = dialSize / 2
  const cy = dialSize / 2
  const outerR = dialSize / 2 - 10
  const tickR = outerR - 12
  const labelR = outerR - 40

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Dial */}
        <div className="relative flex-shrink-0">
          <svg viewBox={`0 0 ${dialSize} ${dialSize}`} width={dialSize} height={dialSize}>
            <defs>
              <filter id="dial-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer ring */}
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {/* Arc segments for each step */}
            {steps.map((_, i) => {
              const startAngle = i * anglePerStep - 90
              const endAngle = startAngle + anglePerStep - 2
              const startRad = (startAngle * Math.PI) / 180
              const endRad = (endAngle * Math.PI) / 180
              const x1 = cx + tickR * Math.cos(startRad)
              const y1 = cy + tickR * Math.sin(startRad)
              const x2 = cx + tickR * Math.cos(endRad)
              const y2 = cy + tickR * Math.sin(endRad)
              const largeArc = anglePerStep > 180 ? 1 : 0

              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} A ${tickR} ${tickR} 0 ${largeArc} 1 ${x2} ${y2}`}
                  fill="none"
                  stroke={i === activeStep ? '#EAC46C' : 'rgba(255,255,255,0.08)'}
                  strokeWidth={i === activeStep ? '3' : '1.5'}
                  strokeLinecap="round"
                  style={{ transition: 'stroke 0.5s ease, stroke-width 0.3s ease' }}
                />
              )
            })}

            {/* Step position markers */}
            {steps.map((step, i) => {
              const angle = (i * anglePerStep - 90) * (Math.PI / 180)
              const x = cx + labelR * Math.cos(angle)
              const y = cy + labelR * Math.sin(angle)

              return (
                <g key={i}>
                  <circle
                    cx={cx + tickR * Math.cos(angle)}
                    cy={cy + tickR * Math.sin(angle)}
                    r={i === activeStep ? 5 : 3}
                    fill={i === activeStep ? '#EAC46C' : 'rgba(255,255,255,0.2)'}
                    style={{ transition: 'all 0.4s ease' }}
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={i === activeStep ? '#EAC46C' : 'rgba(255,255,255,0.3)'}
                    fontSize="11"
                    fontFamily="var(--font-jetbrains, monospace)"
                    fontWeight={i === activeStep ? '600' : '400'}
                    style={{ transition: 'fill 0.4s ease' }}
                  >
                    {step.number}
                  </text>
                </g>
              )
            })}

            {/* Needle */}
            <g
              style={{
                transform: `rotate(${needleAngle}deg)`,
                transformOrigin: `${cx}px ${cy}px`,
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy - outerR + 30}
                stroke="#EAC46C"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#dial-glow)"
              />
              <circle cx={cx} cy={cy - outerR + 28} r="3" fill="#EAC46C" />
            </g>

            {/* Center */}
            <circle cx={cx} cy={cy} r="6" fill="#EAC46C" />
            <circle cx={cx} cy={cy} r="3" fill="#17171a" />
          </svg>
        </div>

        {/* Step content */}
        <div className="flex-1 min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="font-mono text-xs text-gold-500/60 uppercase tracking-[0.2em] mb-3">
                Step {steps[activeStep].number}
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                {steps[activeStep].title}
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                {steps[activeStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center gap-3 mt-10">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: i === activeStep ? '2rem' : '0.5rem',
                  backgroundColor: i === activeStep ? '#EAC46C' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
