import { useEffect } from "react";
import { useState } from "react";


export default function useWindowSize() {
    const [windowHeight, setwindowHeight] = useState<Number>(0);

    useEffect(() => {
        // function handleResize() {
        //     setWindowSize({
        //         width: window.innerWidth,
        //         height: window.innerHeight,
        //     });
        // }
        // window.addEventListener('resize', handleResize);
        // handleResize();
        

        function handleScroll() {
            const windowScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (windowScroll / height * 100);
            setwindowHeight(scrolled);
        }

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return windowHeight;
}