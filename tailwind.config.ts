import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
                display: ['var(--font-outfit)', 'sans-serif'],
                sora: ['var(--font-sora)', 'sans-serif'],
            },
            colors: {
                // ── Semantic tokens (CSS variables — respond to light/dark) ──
                background:       'var(--color-bg)',
                surface:          'var(--color-surface)',
                'surface-hover':  'var(--color-surface-hover)',
                border:           'var(--color-border)',
                'border-strong':  'var(--color-border-strong)',
                foreground:       'var(--color-fg)',
                'foreground-subtle': 'var(--color-fg-subtle)',
                muted:            'var(--color-muted)',
                accent:           'var(--color-accent)',
                'accent-soft':    'var(--color-accent-soft)',
                'surface-editorial': 'var(--color-surface-editorial)',
                'surface-media': 'var(--color-surface-media)',
                'surface-tint': 'var(--color-surface-tint)',
                'featured':       'var(--color-featured-bg)',
                'featured-fg':    'var(--color-featured-fg)',
                'featured-muted': 'var(--color-featured-muted)',
                'featured-border':'var(--color-featured-border)',
                skeleton:         'var(--color-skeleton)',
                overlay:          'var(--color-overlay)',
                // ── K-real fixed palette ──
                hallyu: {
                    pink:   '#ff2d78',
                    'pink-2': '#ff6fa3',
                    'pink-3': '#fff0f5',
                    dark:   '#080808',
                    muted:  '#6b6b6b',
                    border: '#e8e8e8',
                    bg:     '#f5f5f7',
                },
                // Legacy support (careful refactoring later)
                purple: {
                    400: '#c084fc',
                    500: '#bc13fe', // Updated to Cyber Purple
                    600: '#9333ea',
                    900: '#581c87',
                },
                // New Palette
                cyber: {
                    purple: '#bc13fe',
                    DEFAULT: '#bc13fe',
                },
                neon: {
                    pink: '#ff00ff',
                    cyan: '#00f3ff',
                    green: '#39ff14',
                },
                dark: {
                    bg: '#050505',
                    card: '#121212',
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "hero-glow": "radial-gradient(circle at center, rgba(188, 19, 254, 0.25) 0%, transparent 60%)",
                "neon-flow": "linear-gradient(to right, #bc13fe, #ff00ff, #00f3ff)",
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'neon-hover': '0 0 40px -10px rgba(188, 19, 254, 0.3)',
                'glow-white': '0 0 30px rgba(255, 255, 255, 0.4)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'shimmer': 'shimmer 2s infinite linear',
                'gradient': 'gradient 8s linear infinite',
                'home-ticker':  'home-ticker 42s linear infinite',
                'home-marquee': 'home-marquee 24s linear infinite',
                'slideUp': 'slideUp 300ms ease-out',
                'fadeInUp': 'fadeInUp 350ms ease-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    'from': { boxShadow: '0 0 10px #bc13fe, 0 0 20px #bc13fe' },
                    'to': { boxShadow: '0 0 20px #ff00ff, 0 0 30px #ff00ff' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                'home-ticker': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                'home-marquee': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                fadeInUp: {
                    '0%': { transform: 'translateY(24px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            }
        },
    },
    plugins: [require('@tailwindcss/typography')],
};
export default config;
