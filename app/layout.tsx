import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Seduz | Prazer com Estilo',
  description: 'Descubra sensações únicas com produtos selecionados para momentos de prazer e intimidade. Elegância, qualidade e conforto para a sua experiência.',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
