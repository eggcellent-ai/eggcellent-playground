import type { Config } from 'tailwindcss'

const config: Config = {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				// Base colors
				background: 'var(--background)',
				foreground: 'var(--foreground)',

				// Semantic colors
				primary: {
					DEFAULT: 'var(--primary)',
					light: 'var(--primary-light)',
					dark: 'var(--primary-dark)',
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					light: 'var(--secondary-light)',
					dark: 'var(--secondary-dark)',
				},
				neutral: {
					DEFAULT: 'var(--neutral)',
					light: 'var(--neutral-light)',
					dark: 'var(--neutral-dark)',
					hover: 'var(--neutral-hover)',
				},
				success: {
					DEFAULT: 'var(--success)',
					light: 'var(--success-light)',
					dark: 'var(--success-dark)',
				},
				error: {
					DEFAULT: 'var(--error)',
					light: 'var(--error-light)',
					dark: 'var(--error-dark)',
				},
				warning: {
					DEFAULT: 'var(--warning)',
					light: 'var(--warning-light)',
					dark: 'var(--warning-dark)',
				},

				// Text colors
				text: {
					primary: 'var(--text-primary)',
					secondary: 'var(--text-secondary)',
					muted: 'var(--text-muted)',
					inverse: 'var(--text-inverse)',
				},

				// Surface colors
				surface: {
					card: 'var(--surface-card)',
					input: 'var(--surface-input)',
				},
			},
			fontFamily: {
				sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
				mono: [
					'var(--font-geist-mono)',
					'ui-monospace',
					'SFMono-Regular',
					'monospace',
				],
			},
		},
	},
	plugins: [],
}

export default config
