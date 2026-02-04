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
            },
            colors: {
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
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    'from': { boxShadow: '0 0 10px #bc13fe, 0 0 20px #bc13fe' },
                    'to': { boxShadow: '0 0 20px #ff00ff, 0 0 30px #ff00ff' },
                }
            }
        },
    },
    plugins: [],
};
export default config;
