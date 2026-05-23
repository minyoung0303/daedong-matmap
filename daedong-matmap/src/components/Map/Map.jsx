import { useEffect, useRef } from 'react';

const Map = () => {
    const mapRef = useRef(null);

    useEffect(() => {
        const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
        
        if (!kakaoKey) {
            console.error("VITE_KAKAO_JS_KEY가 없습니다.");
            return;
        }

        const createMap = () => {
            if (!mapRef.current || !window.kakao?.maps) return;

            window.kakao.maps.load(() => {
                const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.9780); // 서울 중심 좌표

                const map = new window.kakao.maps.Map(mapRef.current,{
                    center: defaultCenter,
                    level: 4,
                });

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const currentPosition = new window.kakao.maps.LatLng(
                                position.coords.latitude,
                                position.coords.longitude
                            );

                            const marker = new window.kakao.maps.Marker({
                                position: currentPosition,
                            });

                            marker.setMap(map);
                            map.setCenter(currentPosition);
                        },
                        (error) => {
                            console.error("현재 위치 확인 불가:", error);
                        }
                    );
                } else {
                    console.error("Geolocation을 지원하지 않는 브라우저입니다.");
                }
            });
        };

        const existingScript = document.querySelector(
            `script[src*="dapi.kakao.com/v2/maps/sdk.js"]`
        );

        if (existingScript) {
            createMap();
            return;
        }
        
        const script = document.createElement("script");
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
        script.async = true;
        script.onload = createMap;
        script.onerror = () => {
            console.error("KakaoMap SDK load failed.");
        };

        document.head.appendChild(script);
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