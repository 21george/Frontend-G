import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'CoachPro — Coaching Platform',
  description: 'Professional fitness coaching management platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var raw=localStorage.getItem('coach-theme');var theme=null;if(raw){var parsed=JSON.parse(raw);theme=parsed&&parsed.state&&parsed.state.theme;}if(!theme){theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var root=document.documentElement;if(theme==='dark'){root.classList.add('dark');root.style.colorScheme='dark';}else{root.classList.remove('dark');root.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-[var(--bg-page)] text-[var(--text-primary)] antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
