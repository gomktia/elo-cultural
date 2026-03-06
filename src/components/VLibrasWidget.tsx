'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export function VLibrasWidget() {
  useEffect(() => {
    // Set custom VLibras attributes after mount
    const wrapper = document.getElementById('vlibras-wrapper')
    if (wrapper) {
      wrapper.setAttribute('vw', 'true')
      const btn = wrapper.querySelector('[data-vw-access-button]')
      if (btn) btn.setAttribute('vw-access-button', 'true')
      const plug = wrapper.querySelector('[data-vw-plugin-wrapper]')
      if (plug) plug.setAttribute('vw-plugin-wrapper', 'true')
    }
  }, [])

  return (
    <>
      <div id="vlibras-wrapper" className="enabled">
        <div data-vw-access-button="true" className="active" />
        <div data-vw-plugin-wrapper="true">
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>
      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="lazyOnload"
        onLoad={() => {
          const w = window as any
          if (w.VLibras) new w.VLibras.Widget('https://vlibras.gov.br/app')
        }}
      />
    </>
  )
}
