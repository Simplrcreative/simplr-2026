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

    // Applied to <picture>, not <img>, so GSAP can animate .thumb-primary/.thumb-secondary freely
    const blurStyle = {
        filter: isFullLoaded ? 'none' : 'blur(12px)',
        // scale(1.05) pushes blurred edges outside the parent's overflow:hidden area
        transform: isFullLoaded ? 'scale(1)' : 'scale(1.05)',
        transition: isIntersecting ? 'filter 0.6s ease, transform 0.6s ease' : 'none',
    };

    return (
        <picture ref={pictureRef} className={pictureClass} style={blurStyle}>
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
            />
        </picture>
    );
}
                