/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0284c7',
                    dark: '#0369a1',
                    light: '#e0f2fe'
                },
                background: {
                    main: '#f0f9ff',
                    card: '#ffffff'
                }
            },
            fontFamily: {
                sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'sans-serif']
            },
            fontSize: {
                'total': ['1.75rem', { lineHeight: '2rem', fontWeight: '700' }],
                'product': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '500' }]
            },
            spacing: {
                'touch': '44px',
                'button': '48px'
            },
            minHeight: {
                'touch': '44px',
                'button': '48px'
            }
        },
    },
    plugins: [],
}
