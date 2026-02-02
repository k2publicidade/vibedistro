import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                vibeorange: {
                    400: '#FF6B35', // Lighter orange
                    500: '#FF5722', // Main orange-red
                    600: '#F4511E', // Darker orange-red
                    700: '#E64A19', // Deep orange-red
                },
            },
        },
    },
    plugins: [],
}
export default config
