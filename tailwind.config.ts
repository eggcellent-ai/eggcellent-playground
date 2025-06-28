import type { Config } from 'tailwindcss'

const config: Config = {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				// App semantic colors
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				textMain: 'var(--color-text-main)',
				textSub: 'var(--color-text-sub)',
				app: 'var(--color-app)',
				border: 'var(--color-border)',
				page: 'var(--color-background)',
				button: 'var(--color-button)',
				green: {
					DEFAULT: 'var(--color-green)',
					light: 'var(--color-green-light)',
					border: 'var(--color-green-border)',
				},
				pink: 'var(--color-pink)',

				// Legacy colors (keeping for compatibility)
				primary: {
					DEFAULT: 'var(--color-green)',
					hover: 'var(--color-app)',
				},

				// Surface colors (keeping for compatibility)
				surface: {
					background: 'var(--surface-background)',
					foreground: 'var(--surface-foreground)',
					card: 'var(--surface-card)',
					hover: 'var(--surface-hover)',
					border: 'var(--surface-border)',
					input: 'var(--surface-input)',
				},

				// Text colors (keeping for compatibility)
				text: {
					primary: 'var(--text-primary)',
					secondary: 'var(--text-secondary)',
					muted: 'var(--text-muted)',
					inverse: 'var(--text-inverse)',
				},
			},
			fontFamily: {
				sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
				mono: ['var(--font-geist-mono)', 'monospace'],
			},
		},
	},
	plugins: [],
}

export default config
