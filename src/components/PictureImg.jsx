import { useState, useEffect, useRef } from 'react';

export default function PictureImg({ loaderSrc, mobileSrc, desktopSrc, altText = '', imgClass = '', pictureClass = '', lazyLoad = true }) {

    const [isIntersecting, setIsIntersecting] = useState(!lazyLoad);
    const [isFullLoaded, setIsFullLoaded] = useState(false);
    const pictureRef = useRef(null);

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
        }
    }, [isIntersecting, loaderSrc, mobileSrc, desktopSrc]);

    // Only mark as loaded once the *full* image fires onLoad, not the placeholder
    const handleLoad = () => {
        if (isIntersecting) setIsFullLoaded(true);
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
        <picture ref={pictureRef} className={pictureClass}>
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
                onLoad={handleLoad}
                style={imgStyle}
            />
        </picture>
    );
}
                