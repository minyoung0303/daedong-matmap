import { useEffect, useRef } from 'react';
import { useKakaoMap } from '../../hooks/useKakaoMap.js';
import { escapeHtml, formatDistance } from '../../utils/format.js';
import styles from './Map.module.css';

/**
 * 지도와 마커만 담당하는 컴포넌트.
 * 검색과 위치 상태는 App이 들고 있고, 여기는 결과를 그리는 역할만 한다.
 *
 * 주의: 컴포넌트 이름이 Map이라서 내부에서 전역 Map 생성자를 쓸 수 없다.
 * 마커 보관은 일반 객체(id -> marker)로 한다.
 */
function Map({ center, currentPosition, places = [], selectedId, onSelect }) {
  const { containerRef, map, errorMessage } = useKakaoMap({ initialCenter: center });

  const placeMarkersRef = useRef({});
  const currentMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const hasFittedRef = useRef(false);

  // 현재 위치 마커
  useEffect(() => {
    if (!map || !currentPosition) {
      return;
    }

    const { kakao } = window;
    const position = new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng);

    if (currentMarkerRef.current) {
      currentMarkerRef.current.setPosition(position);
    } else {
      currentMarkerRef.current = new kakao.maps.Marker({
        map,
        position,
        zIndex: 10,
        title: '현재 위치',
      });
    }

    // 아직 검색 결과가 없을 때만 현재 위치로 중심을 옮긴다.
    if (!hasFittedRef.current) {
      map.setCenter(position);
    }
  }, [map, currentPosition]);

  // 검색 결과 -> 마커 동기화
  useEffect(() => {
    if (!map) {
      return;
    }

    const { kakao } = window;

    // 이전 마커 제거
    Object.values(placeMarkersRef.current).forEach((marker) => marker.setMap(null));
    placeMarkersRef.current = {};

    if (places.length === 0) {
      return;
    }

    const bounds = new kakao.maps.LatLngBounds();

    places.forEach((place) => {
      const position = new kakao.maps.LatLng(place.lat, place.lng);
      const marker = new kakao.maps.Marker({ map, position, title: place.name });

      kakao.maps.event.addListener(marker, 'click', () => onSelect?.(place.id));

      placeMarkersRef.current[place.id] = marker;
      bounds.extend(position);
    });

    if (currentPosition) {
      bounds.extend(new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng));
    }

    map.setBounds(bounds);
    hasFittedRef.current = true;

    return () => {
      Object.values(placeMarkersRef.current).forEach((marker) => marker.setMap(null));
      placeMarkersRef.current = {};
    };
    // currentPosition은 bounds 계산에만 쓰고, 위치가 갱신될 때마다 다시 맞추지는 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, places, onSelect]);

  // 선택된 장소 -> InfoWindow + 중심 이동
  useEffect(() => {
    if (!map) {
      return;
    }

    const { kakao } = window;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new kakao.maps.InfoWindow({ removable: true, zIndex: 20 });
    }

    const infoWindow = infoWindowRef.current;
    const place = places.find((item) => item.id === selectedId);

    if (!place) {
      infoWindow.close();
      return;
    }

    const distance = formatDistance(place.distance);
    // 카카오에서 온 값이므로 반드시 이스케이프한다.
    infoWindow.setContent(
      `<div class="${styles.infoWindow}">
         <strong>${escapeHtml(place.name)}</strong>
         ${distance ? `<span>${escapeHtml(distance)}</span>` : ''}
       </div>`
    );

    const marker = placeMarkersRef.current[place.id];

    if (marker) {
      infoWindow.open(map, marker);
    }

    map.panTo(new kakao.maps.LatLng(place.lat, place.lng));
  }, [map, places, selectedId]);

  return (
    <div className={styles.container}>
      {/* 지도는 마우스/터치 전용이라, 키보드와 스크린리더 사용자는 아래 리스트로 같은 정보를 얻는다. */}
      <div ref={containerRef} className={styles.map} role="region" aria-label="주변 장소 지도" />

      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default Map;
