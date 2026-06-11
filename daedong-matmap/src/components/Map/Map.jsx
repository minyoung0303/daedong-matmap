import { useEffect, useRef, useState } from 'react';
import styles from './Map.module.css';

const Map = () => {
    const mapRef = useRef(null);
    const kakaoMapRef = useRef(null);
    const markerRef = useRef(null);
    const psRef = useRef(null);
    const placeMarkerRef = useRef([]);
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
        
        if (!kakaoKey) {
            console.error("VITE_KAKAO_JS_KEY가 없습니다.");
            return;
        }

        const clearPlaceMarkers = () => {
            placeMarkersRef.current.forEach(marker => marker.setMap(null));
            placeMarkersRef.current = [];
        }

        const searchPlaces = (searchKeyword) => {
            if (!psRef.current || !kakaoMapRef.current) return;

            setKeyword(searchKeyword);
            clearPlaceMarkers();

            psRef.current.keywordSearch(searchKeyword, (data, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    console.error(`${searchKeyword} 검색 결과가 없습니다.`);
                    return;
                }

                const bounds = new window.kakao.maps.LatLngBounds();

                data.forEach((place) => {
                    const position = new window.kakao.maps.LatLng(place.y, place.x);

                    const marker = new window.kakao.maps.Marker({
                        map: kakaoMapRef.current,
                        position,
                    });

                    placeMarkersRef.current.push(marker);
                    bounds.extent(position);
                });

                kakaoMapRef.current.setBounds(bounds);
            });
        };

        const createMap = () => {
            if (!mapRef.current || !window.kakao?.maps) return;

            window.kakao.maps.load(() => {
                const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.9780); // 서울 중심 좌표

                const map = new window.kakao.maps.Map(mapRef.current,{
                    center: defaultCenter,
                    level: 4,
                });

                kakaoMapRef.current = map;

                if (window.kakao.maps.services) {
                    psRef.current = new window.kakao.maps.services.Places();
                }

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
                            markerRef.current = marker;
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

    const handleSearchRestaurant = () => {
        if (!psRef.current) {
            console.error("장소 검색 서비스를 사용할 수 없습니다.");
            return;
        }
        searchNearby("밥집");
    };

    const handleSearchCafe = () => {
        if (!psRef.current) {
            console.error("장소 검색 서비스를 사용할 수 없습니다.");
            return;
        }
        searchNearby("카페");
    };

    const searchNearby = (searchKeyword) => {
        if (!psRef.current || !kakaoMapRef.current) return;
        
        placeMarkersRef.current.forEach((marker) => marker.setMap(null));
        placeMarkersRef.current = [];

        const center = kakaoMapRef.current.getCenter();

        psRef.current.keywordSearch(searchKeyword, (data, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                console.error(`${searchKeyword} 검색 결과가 없습니다.`);
                return;
            }

            const bounds = new window.kakao.maps.LatLngBounds();

            data.forEach((place) => {
                const position = new window.kakao.maps.LatLng(place.y, place.x);

                const marker = new window.kakao.maps.Marker({
                    map: kakaoMapRef.current,
                    position,
                });

                placeMarkersRef.current.push(marker);
                bounds.extend(poisition);
            });

            bounds.extend(center);
            kakaoMapRef.current.setBounds(bounds);
            setKeyword(searchKeyword);
        }, {
            location: center,
            radius: 3000,
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.button}
                    onClick={handleSearchRestaurant}
                >
                    밥집 검색
                </button>
                <button
                    type="button"
                    className={styles.button}
                    onClick={handleSearchCafe}
                >
                    카페 검색
                </button>
            </div>
            <div
                ref={mapRef}
                className={styles.map}
                aria-label={keyword ? `${keyword} 검색 지도` : "지도"}
            />
            </div>
    );
};

export default Map;