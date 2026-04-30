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
                    DEFAULT: '#e91e63',
                    dark: '#c2185b',
                    light: '#f8bbd9'
                },
                background: {
                    main: '#fff5f8',
                    card: '#ffffff'
                }
            },
            fontFamily: {
                sans: ['system-ui', '-apple-system', 'Roboto', 'sans-serif']
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
