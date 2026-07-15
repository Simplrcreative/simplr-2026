import { useEffect, useMemo } from 'react'
import { createClientsScrollAnimation, refreshScrollTriggers } from '../lib/animations/index.js'

function getClientLogoSrc(client) {
  return client?.acfLogo?.node?.sourceUrl || ''
}

function LogoStrip({ clients, sliderClass, keyPrefix }) {
  return (
    <div className={`client-logos ${sliderClass} flex flex-nowrap items-center`}>
      {clients.map((client, index) => {
        const name = client?.acfClient || 'Client'
        const format = client?.acfLogoFormat ?? 'landscape'
        const src = getClientLogoSrc(client)

        return (
          <div className="client-logo" key={`${keyPrefix}-${name}-${index}`}>
            <img
              src={src}
              alt={name}
              className={format}
              loading="eager"
              decoding="async"
              draggable={false}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function ClientLogos({
  innerRef,
  clients = [],
  shouldAnimate = false,
}) {
  const logos = useMemo(
    () => clients.filter((client) => getClientLogoSrc(client)),
    [clients],
  )

  const { topLogos, bottomLogos } = useMemo(() => {
    const midpoint = Math.ceil(logos.length / 2)
    return {
      topLogos: logos.slice(0, midpoint),
      bottomLogos: logos.slice(midpoint),
    }
  }, [logos])

  useEffect(() => {
    if (!shouldAnimate || !innerRef?.current || !logos.length) return undefined

    const cleanupClientsAnimation = createClientsScrollAnimation(innerRef.current) ?? (() => {})
    refreshScrollTriggers()

    return () => {
      cleanupClientsAnimation()
    }
  }, [innerRef, shouldAnimate, logos.length])

  if (!logos.length) return null

  return (
    <div ref={innerRef} className="bg-coffee section-dark pt-0 md:pt-20 xl:pt-0 pb-20 xl:pb-0 xl:min-h-screen">
      <section className="clients py-10 md:pt-40 md:pb-10 overflow-hidden text-white">
        <LogoStrip
          clients={topLogos}
          sliderClass="logo-slider-1"
          keyPrefix="top"
        />
      </section>

      <section className="trigger-split-text bg-coffee section-dark px-5 md:py-10 xl:py-20">
        <div className="grid grid-cols-12">
          <div className="quote col-start-3 col-span-8 flex justify-center">
            <div className="max-w-[36ch] text-white split-text text-center">
              Proudly partnering with brands to create <span><i>meaningful</i> design experiences</span>
            </div>
          </div>
        </div>
      </section>

      {bottomLogos.length > 0 ? (
        <section className="clients py-10 md:py-20 bg-coffee section-dark overflow-hidden text-white">
          <LogoStrip
            clients={bottomLogos}
            sliderClass="logo-slider-2"
            keyPrefix="bottom"
          />
        </section>
      ) : null}
    </div>
  )
}
