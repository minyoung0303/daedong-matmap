/** 거리(m)를 사람이 읽기 쉬운 문자열로 바꾼다. */
export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) {
    return '';
  }

  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }

  return `${(meters / 1000).toFixed(1)}km`;
}

/** 전화번호가 없을 때 빈 값을 감춘다. */
export function formatPhone(phone) {
  return phone?.trim() ? phone : '';
}

/**
 * 외부 API에서 온 문자열을 HTML에 넣기 전에 이스케이프한다.
 * 카카오 응답을 InfoWindow의 setContent에 그대로 꽂으면 XSS 위험이 있다.
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
