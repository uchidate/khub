'use client'

import { useRef, useState, useEffect } from 'react'

export function useAdFilled(slot: string | undefined, timeoutMs = 4000) {
    const insRef = useRef<HTMLModElement>(null)
    const [filled, setFilled] = useState<boolean | null>(null)

    useEffect(() => {
        if (!slot) { setFilled(false); return }
        const ins = insRef.current
        if (!ins) return

        const check = () => {
            const status = ins.getAttribute('data-ad-status')
            if (status === 'unfilled') setFilled(false)
            else if (status === 'filled') setFilled(true)
        }

        const mo = new MutationObserver(check)
        mo.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] })

        const timeout = setTimeout(() => {
            if (!ins.getAttribute('data-ad-status')) setFilled(false)
        }, timeoutMs)

        return () => { mo.disconnect(); clearTimeout(timeout) }
    }, [slot, timeoutMs])

    return { insRef, filled }
}
