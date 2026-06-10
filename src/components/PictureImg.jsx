import { useState, useEffect, useRef } from 'react';

export default function PictureImg({ loaderSrc, mobileSrc, desktopSrc, altText = '', imgClass = '', lazyLoad = true }) {
    
    const screenWidth = window.innerWidth
    const isMobile = screenWidth < 768
    const fullSrc = isMobile ? mobileSrc : desktopSrc
    const [isIntersecting, setIsIntersecting] = useState(false);
    const imgRef = useRef(null);
   
    useEffect(() => {
        const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect(); // Stop observing once loaded
            }
        },
        { rootMargin: '50px' } // Pre-load 50px before entering viewport
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
            imgRef.current.classList.add('loaded')
        } else {
            imgRef.current.classList.remove('loaded')
        }

        return () => observer.disconnect();
    }, []);


    return (
        <picture>
            {/*}
            <source 
                type="image/webp" 
                media="(max-width:768px)" 
                data-srcset={mobileSrc} 
                srcSet={loaderSrc} />
            <source 
                type="image/webp" 
                data-srcset={desktopSrc} 
                srcSet={loaderSrc} />
            <img 
                ref={imgRef}
                data-src={loaderSrc} 
                src={loaderSrc} 
                className={`lazy ${imgClass}`} 
                alt={altText} 
            />
            */}
            <img
                ref={imgRef}
                src={isIntersecting ? fullSrc : loaderSrc}
                alt={altText}
                className={`lazy ${imgClass}`}
            />
        </picture>
    )
}
                