import { useEffect, useRef } from 'react';

const Map = () => {
    const mapRef = useRef(null);

    useEffect(() => {
        const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
        const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;

        const loadKakaoMap = () => {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => {
                    const container = mapRef.current;
                    const options = {
                        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
                        level: 5,
                    };

                    new window.kakao.maps.Map(container, options);
                });
                return;
            }

            const script = document.createElement("script");
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
            script.async = true;
            // document.head.appendChild(script);

            script.onload = () => {
                window.kakao.maps.load(() => {
                    const container = mapRef.current;
                    const options = {
                        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
                        level: 5,
                    };

                    new window.kakao.maps.Map(container, options);
                });
            };
        };

        loadKakaoMap();
    }, []);

    return (
        <div
            ref={mapRef}
            style={{
                width: "100%",
                height: "500px",
            }}
        />
   );
};

export default Map;