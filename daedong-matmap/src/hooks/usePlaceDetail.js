import { useCallback, useEffect, useState } from 'react';
import { deleteMyReview, fetchPlaceDetail, isBackendEnabled, saveReview } from '../api/backend.js';
import { getUserKey } from '../api/user.js';

/**
 * 선택한 장소의 상세(메뉴 + 별점 + 리뷰)를 백엔드에서 가져오는 훅.
 *
 * 장소 기본 정보(이름, 주소, 거리)는 이미 카카오 검색 결과에 있으므로 다시 받지 않는다.
 * 백엔드에서 받아오는 건 우리 앱에만 있는 데이터(메뉴, 리뷰, 평점)뿐이다.
 *
 * 이 훅은 장소마다 새로 마운트되는 것을 전제로 한다. (PlaceSheet에 key를 준다)
 * 그래서 장소가 바뀔 때 상태를 되돌리는 로직이 필요하지 않다.
 */

export const DETAIL_STATUS = {
  /** 백엔드가 연결되지 않은 배포 환경. 메뉴/리뷰를 아예 보여주지 않는다. */
  DISABLED: 'disabled',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

const EMPTY_DETAIL = {
  placeId: null,
  registered: false,
  ratingAverage: 0,
  ratingCount: 0,
  menus: [],
  reviews: [],
  myReview: null,
};

/** 상태를 건드리지 않는 순수 조회 함수 */
function requestDetail(kakaoPlaceId) {
  return getUserKey().then((userKey) => fetchPlaceDetail(kakaoPlaceId, userKey));
}

export function usePlaceDetail(place) {
  const [detail, setDetail] = useState(EMPTY_DETAIL);

  // 마운트되면 바로 조회하므로 초기 상태를 LOADING으로 확정해둔다.
  const [status, setStatus] = useState(isBackendEnabled ? DETAIL_STATUS.LOADING : DETAIL_STATUS.DISABLED);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 다시 시도할 때 이 값을 늘려서 아래 effect를 재실행시킨다.
  const [reloadToken, setReloadToken] = useState(0);

  const kakaoPlaceId = place?.id ?? null;

  useEffect(() => {
    // 백엔드가 없는 배포 환경에서는 아예 호출하지 않는다. (status는 DISABLED로 시작한다)
    if (!isBackendEnabled || !kakaoPlaceId) {
      return undefined;
    }

    // 언마운트되거나 장소가 바뀌면 늦게 도착한 응답을 무시한다.
    let cancelled = false;

    requestDetail(kakaoPlaceId)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setDetail(result);
        setStatus(DETAIL_STATUS.SUCCESS);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setDetail(EMPTY_DETAIL);
        setErrorMessage(error.message);
        setStatus(DETAIL_STATUS.ERROR);
      });

    return () => {
      cancelled = true;
    };
  }, [kakaoPlaceId, reloadToken]);

  const submitReview = useCallback(
    async ({ rating, content }) => {
      if (!place) {
        return false;
      }

      setIsSubmitting(true);
      setErrorMessage('');

      try {
        const userKey = await getUserKey();
        const result = await saveReview({ place, userKey, rating, content });

        setDetail(result);
        setStatus(DETAIL_STATUS.SUCCESS);
        return true;
      } catch (error) {
        setErrorMessage(error.message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [place]
  );

  const removeReview = useCallback(async () => {
    if (!place) {
      return false;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const userKey = await getUserKey();
      const result = await deleteMyReview({ place, userKey });

      setDetail(result);
      setStatus(DETAIL_STATUS.SUCCESS);
      return true;
    } catch (error) {
      setErrorMessage(error.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [place]);

  /** 사용자가 직접 다시 시도할 때 사용한다. (이벤트 핸들러라 여기서는 setState가 문제없다) */
  const retry = useCallback(() => {
    if (!isBackendEnabled) {
      return;
    }

    setStatus(DETAIL_STATUS.LOADING);
    setErrorMessage('');
    setReloadToken((token) => token + 1);
  }, []);

  return { detail, status, errorMessage, isSubmitting, submitReview, removeReview, retry };
}
