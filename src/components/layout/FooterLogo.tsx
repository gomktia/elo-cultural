'use client'

export function FooterLogo({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Governo"
      className="h-10 w-auto opacity-60"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
