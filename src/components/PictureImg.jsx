import { useState, useEffect, useRef } from 'react';

export default function PictureImg({
  loaderSrc,
  mobileSrc,
  desktopSrc,
  altText = '',
  imgClass = '',
  pictureClass = '',
  lazyLoad = true,
  width,
  height,
  attributes = {},
  onSettled,
}) {

    const [isIntersecting, setIsIntersecting] = useState(!lazyLoad);
    const [isFullLoaded, setIsFullLoaded] = useState(false);
    const pictureRef = useRef(null);
    const hasSettledRef = useRef(false);

    // Notify the caller once, whether the full image resolves or fails to load,
    // so layout-dependent code (e.g. masonry grids driving ScrollTrigger) can
    // recalculate once every item has settled instead of guessing at a timeout.
    const notifySettled = () => {
        if (hasSettledRef.current) return;
        hasSettledRef.current = true;
        onSettled?.();
    };

    useEffect(() => {
        if (!lazyLoad) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsIntersecting(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '50px' }
        );

        if (pictureRef.current) observer.observe(pictureRef.current);

        return () => observer.disconnect();
    }, [lazyLoad]);

    // If all three sources are identical, no new browser load fires after intersection —
    // the blur would never clear. Detect this and resolve immediately.
    useEffect(() => {
        if (isIntersecting && loaderSrc === mobileSrc && loaderSrc === desktopSrc) {
            setIsFullLoaded(true);
            notifySettled();
        }
    }, [isIntersecting, loaderSrc, mobileSrc, desktopSrc]);

    // Only mark as loaded once the *full* image fires onLoad, not the placeholder
    const handleLoad = () => {
        if (isIntersecting) {
            setIsFullLoaded(true);
            notifySettled();
        }
    };

    // A failed load should still unblock any "all items settled" logic upstream.
    const handleError = () => {
        notifySettled();
    };

    // Filter is on <img>, NOT <picture>, for two reasons:
    // 1. <picture> is used as the dock target in page transitions — any transform on it
    //    inflates getBoundingClientRect() and breaks the dock animation sizing.
    // 2. GSAP hover animation uses transform/clipPath/zIndex on the <img> but never filter,
    //    so filter is the one property we can safely own on the same element.
    // No scale() needed — the parent always has overflow:hidden which clips blur edges.
    const imgStyle = {
        filter: isFullLoaded ? 'none' : 'blur(12px)',
        transition: isIntersecting ? 'filter 0.6s ease' : 'none',
    };

    return (
        <picture ref={pictureRef} className={pictureClass} {...attributes}>
            <source
                media="(max-width:767px)"
                srcSet={isIntersecting ? mobileSrc : loaderSrc}
            />
            <source
                srcSet={isIntersecting ? desktopSrc : loaderSrc}
            />
            <img
                src={loaderSrc}
                alt={altText}
                className={imgClass}
                width={width || undefined}
                height={height || undefined}
                onLoad={handleLoad}
                onError={handleError}
                style={imgStyle}
            />
        </picture>
    );
}
                