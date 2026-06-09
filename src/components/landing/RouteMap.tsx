'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface RouteStation {
  title: string
  description: string
  label: string
}

interface RouteMapProps {
  stations: RouteStation[]
  className?: string
}

export function RouteMap({ stations, className = '' }: RouteMapProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const stationRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const totalWidth = track.scrollWidth
    const viewWidth = section.offsetWidth
    const scrollDistance = totalWidth - viewWidth

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: -scrollDistance,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          end: () => `+=${scrollDistance}`,
          invalidateOnRefresh: true,
        },
      })

      if (pathRef.current) {
        const pathLength = pathRef.current.getTotalLength()
        gsap.set(pathRef.current, { strokeDasharray: pathLength, strokeDashoffset: pathLength })
        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${scrollDistance}`,
            scrub: 1,
          },
        })
      }

      stationRefs.current.forEach((station, i) => {
        if (!station) return
        gsap.from(station.querySelectorAll('.station-content > *'), {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          scrollTrigger: {
            trigger: station,
            containerAnimation: gsap.getById('routeScroll') || undefined,
            start: 'left 70%',
            end: 'left 40%',
            scrub: true,
          },
        })
      })
    }, section)

    return () => ctx.revert()
  }, [stations])

  const stationWidth = 100 / stations.length

  return (
    <div ref={sectionRef} className={`relative overflow-hidden ${className}`}>
      {/* Topographic background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          radial-gradient(ellipse 600px 200px at 20% 30%, rgba(110,43,242,0.04) 0%, transparent 70%),
          radial-gradient(ellipse 400px 300px at 60% 70%, rgba(234,196,108,0.03) 0%, transparent 70%),
          radial-gradient(ellipse 500px 250px at 80% 20%, rgba(110,43,242,0.03) 0%, transparent 70%)
        `,
      }} />

      <div ref={trackRef} className="flex items-center h-full will-change-transform" style={{ width: `${stations.length * 100}vw` }}>
        {/* SVG route path */}
        <svg className="absolute top-1/2 left-0 -translate-y-1/2 pointer-events-none" width="100%" height="4" style={{ zIndex: 0 }}>
          <line x1="0" y1="2" x2="100%" y2="2" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <path
            ref={pathRef}
            d={`M 0 2 L ${stations.length * 100}vw 2`}
            fill="none"
            stroke="#EAC46C"
            strokeWidth="2"
            strokeDasharray="8 12"
            opacity="0.6"
          />
        </svg>

        {/* Stations */}
        {stations.map((station, i) => (
          <div
            key={i}
            ref={el => { stationRefs.current[i] = el }}
            className="relative flex-shrink-0 flex items-center justify-center px-8"
            style={{ width: `${stationWidth}%` }}
          >
            <div className="station-content max-w-md mx-auto text-center">
              {/* Station marker */}
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="w-4 h-4 rounded-full border-2 border-gold-500 bg-graphite-900 relative z-10" />
                <div className="absolute w-10 h-10 rounded-full border border-gold-500/20" />
                <div className="absolute w-16 h-16 rounded-full border border-gold-500/10" />
              </div>

              {/* Station label */}
              <div className="font-mono text-xs text-gold-500/60 uppercase tracking-[0.2em] mb-3">
                {station.label}
              </div>

              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                {station.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                {station.description}
              </p>

              {/* Connector line to path */}
              <div className="absolute left-1/2 top-1/2 w-px h-16 bg-gradient-to-b from-gold-500/30 to-transparent -translate-x-1/2 translate-y-8" />
            </div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-500 text-xs font-mono">
        <span>scroll</span>
        <div className="w-8 h-px bg-gray-500/50" />
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 4h6M5 2l2 2-2 2" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </div>
  )
}
