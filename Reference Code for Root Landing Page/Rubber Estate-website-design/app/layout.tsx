import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ variable: '--font-plus-jakarta', subsets: ['latin'] })
const cormorantGaramond = Cormorant_Garamond({ variable: '--font-cormorant', weight: ['400', '600', '700'], subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Park Bistro - Dine in the Greenery',
  description: 'A modern culinary retreat surrounded by nature. Fine dining in the park with locally sourced cuisine.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${cormorantGaramond.variable} bg-[#F7F4EF]`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
