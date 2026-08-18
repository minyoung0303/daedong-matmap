import { useEffect, useRef, useState } from 'react';
import Button from '../common/Button.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import RatingStars from '../common/RatingStars.jsx';
import ReviewForm from './ReviewForm.jsx';
import { usePlaceDetail, DETAIL_STATUS } from '../../hooks/usePlaceDetail.js';
import { sharePlace, SHARE_RESULT } from '../../api/share.js';
import { openExternalUrl } from '../../api/platform.js';
import { formatDistance } from '../../utils/format.js';
import styles from './PlaceSheet.module.css';

const SHARE_MESSAGES = {
  [SHARE_RESULT.SHARED]: '공유했어요',
  [SHARE_RESULT.COPIED]: '링크를 복사했어요',
  [SHARE_RESULT.CANCELLED]: '',
  [SHARE_RESULT.UNSUPPORTED]: '이 환경에서는 공유를 지원하지 않아요',
};

function formatPrice(price) {
  if (price == null) {
    return '';
  }

  return `${price.toLocaleString('ko-KR')}원`;
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 가게 상세 바텀시트.
 *
 * 장소 기본 정보는 카카오 검색 결과(place)를 그대로 쓰고,
 * 메뉴 / 별점 / 리뷰만 백엔드에서 받아온다.
 *
 * 시트가 닫히면 App이 이 컴포넌트를 렌더하지 않는다. 즉 언마운트되면서
 * 상세 상태가 알아서 정리되므로 따로 초기화 로직을 두지 않는다.
 */
function PlaceSheet({ place, onClose }) {
  const { detail, status, errorMessage, isSubmitting, submitReview, removeReview, retry } = usePlaceDetail(place);

  const [shareMessage, setShareMessage] = useState('');
  const closeButtonRef = useRef(null);

  // Esc로 닫기
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 열리면 닫기 버튼으로 포커스를 옮겨서 키보드 사용자가 바로 조작할 수 있게 한다.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const handleShare = async () => {
    const result = await sharePlace({
      place,
      ratingAverage: detail.ratingAverage,
      ratingCount: detail.ratingCount,
    });

    setShareMessage(SHARE_MESSAGES[result] ?? '');
  };

  const otherReviews = detail.reviews.filter((review) => !review.mine);

  return (
    <div className={styles.overlay}>
      {/* 배경을 눌러도 닫히도록. 키보드 사용자는 Esc와 닫기 버튼을 쓴다. */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <section className={styles.sheet} role="dialog" aria-modal="true" aria-label={`${place.name} 상세 정보`}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.name}>{place.name}</h2>
            <p className={styles.meta}>
              {place.category}
              {place.distance != null && <span className={styles.distance}> · {formatDistance(place.distance)}</span>}
            </p>
          </div>

          <button ref={closeButtonRef} type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div className={styles.body}>
          {/* 별점 요약 */}
          <div className={styles.ratingSummary}>
            {detail.ratingCount > 0 ? (
              <>
                <RatingStars value={detail.ratingAverage} />
                <strong className={styles.ratingScore}>{detail.ratingAverage.toFixed(1)}</strong>
                <span className={styles.ratingCount}>리뷰 {detail.ratingCount}개</span>
              </>
            ) : (
              <span className={styles.ratingEmpty}>아직 별점이 없어요</span>
            )}
          </div>

          {/* 기본 정보 */}
          <dl className={styles.info}>
            {place.address && (
              <div className={styles.infoRow}>
                <dt>주소</dt>
                <dd>{place.address}</dd>
              </div>
            )}
            {place.phone && (
              <div className={styles.infoRow}>
                <dt>전화</dt>
                <dd>
                  <a className={styles.phoneLink} href={`tel:${place.phone}`}>
                    {place.phone}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {/* 액션 */}
          <div className={styles.actions}>
            <Button onClick={handleShare}>공유하기</Button>
            {place.placeUrl && (
              <Button variant="outline" onClick={() => openExternalUrl(place.placeUrl)}>
                카카오맵에서 보기
              </Button>
            )}
          </div>

          {shareMessage && (
            <p className={styles.shareMessage} role="status">
              {shareMessage}
            </p>
          )}

          {status === DETAIL_STATUS.LOADING && <LoadingSpinner label="가게 정보를 불러오는 중" />}

          {status === DETAIL_STATUS.ERROR && (
            <div className={styles.error} role="alert">
              <p className={styles.errorText}>{errorMessage}</p>
              <Button size="sm" onClick={retry}>
                다시 시도
              </Button>
            </div>
          )}

          {status === DETAIL_STATUS.SUCCESS && (
            <>
              {/* 메뉴 (백엔드가 연결된 환경에서만 렌더된다) */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>메뉴</h3>

                {detail.menus.length > 0 ? (
                  <ul className={styles.menuList}>
                    {detail.menus.map((menu) => (
                      <li key={menu.id} className={styles.menuItem}>
                        <span className={styles.menuName}>
                          {menu.name}
                          {menu.signature && <span className={styles.badge}>대표</span>}
                        </span>
                        <span className={styles.menuPrice}>{formatPrice(menu.price)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyText}>
                    등록된 메뉴가 없어요. 카카오맵에서 메뉴를 확인할 수 있어요.
                  </p>
                )}
              </section>

              {/* 리뷰 */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>리뷰</h3>

                {/* 내 리뷰가 생기거나 삭제되면 key가 바뀌어 폼이 초기화된다. */}
                <ReviewForm
                  key={detail.myReview?.id ?? 'new'}
                  myReview={detail.myReview}
                  isSubmitting={isSubmitting}
                  onSubmit={submitReview}
                  onDelete={removeReview}
                />

                {errorMessage && status === DETAIL_STATUS.SUCCESS && (
                  <p className={styles.inlineError} role="alert">
                    {errorMessage}
                  </p>
                )}

                {otherReviews.length > 0 && (
                  <ul className={styles.reviewList}>
                    {otherReviews.map((review) => (
                      <li key={review.id} className={styles.reviewItem}>
                        <div className={styles.reviewHead}>
                          <RatingStars value={review.rating} />
                          <span className={styles.reviewAuthor}>{review.authorLabel}</span>
                          <span className={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                        </div>
                        {review.content && <p className={styles.reviewContent}>{review.content}</p>}
                      </li>
                    ))}
                  </ul>
                )}

                {detail.ratingCount === 0 && (
                  <p className={styles.emptyText}>첫 리뷰를 남겨보세요.</p>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default PlaceSheet;
