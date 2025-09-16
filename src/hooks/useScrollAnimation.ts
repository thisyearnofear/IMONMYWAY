import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollAnimation() {
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = triggerRef.current;
        if (!element) return;

        // Create scroll-triggered animation
        gsap.fromTo(
            element,
            {
                opacity: 0,
                y: 50,
                scale: 0.9,
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: element,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse",
                },
            }
        );

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    return triggerRef;
}

export function useParallaxAnimation(speed: number = 0.5) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        gsap.to(element, {
            yPercent: -speed * 100,
            ease: "none",
            scrollTrigger: {
                trigger: element,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
            },
        });

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, [speed]);

    return elementRef;
}

export function useThreeScrollAnimation() {
    useEffect(() => {
        // This would integrate with Three.js objects for scroll-based animations
        const handleScroll = () => {
            // Scroll-based Three.js animations can be implemented here
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
}