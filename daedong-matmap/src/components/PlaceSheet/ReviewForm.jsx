import { useState } from 'react';
import Button from '../common/Button.jsx';
import RatingStars from '../common/RatingStars.jsx';
import styles from './ReviewForm.module.css';

const MAX_LENGTH = 1000;

/**
 * 리뷰 작성 / 수정 폼.
 * 이미 쓴 리뷰가 있으면 그 내용을 채워서 수정 모드로 동작한다.
 *
 * 내 리뷰가 생기거나 삭제될 때 폼을 초기화해야 하는데, effect로 되돌리는 대신
 * 호출하는 쪽(PlaceSheet)에서 key를 바꿔 리마운트시킨다.
 * 그러면 아래 useState 초기값이 다시 적용되어 상태가 자연스럽게 맞춰진다.
 */
function ReviewForm({ myReview, isSubmitting, onSubmit, onDelete }) {
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [content, setContent] = useState(myReview?.content ?? '');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (rating < 1) {
      return;
    }

    const saved = await onSubmit({ rating, content });

    if (saved) {
      setIsOpen(false);
    }
  };

  if (!isOpen && !myReview) {
    return (
      <div className={styles.prompt}>
        <p className={styles.promptText}>다녀오셨나요? 별점을 남겨주세요.</p>
        <Button onClick={() => setIsOpen(true)}>리뷰 쓰기</Button>
      </div>
    );
  }

  if (!isOpen && myReview) {
    return (
      <div className={styles.myReview}>
        <div className={styles.myReviewHead}>
          <RatingStars value={myReview.rating} />
          <div className={styles.myReviewActions}>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
              수정
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} disabled={isSubmitting}>
              삭제
            </Button>
          </div>
        </div>
        {myReview.content && <p className={styles.myReviewContent}>{myReview.content}</p>}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.ratingRow}>
        <RatingStars value={rating} onChange={setRating} size="lg" />
        <span className={styles.ratingHint}>{rating > 0 ? `${rating}점` : '별점을 선택해 주세요'}</span>
      </div>

      <label className={styles.field}>
        <span className={styles.srOnly}>리뷰 내용</span>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, MAX_LENGTH))}
          placeholder="어떤 점이 좋았나요? (선택)"
          rows={3}
        />
      </label>

      <div className={styles.actions}>
        <span className={styles.counter}>
          {content.length}/{MAX_LENGTH}
        </span>

        <div className={styles.buttons}>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            취소
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting || rating < 1}>
            {isSubmitting ? '저장 중' : myReview ? '수정 완료' : '등록'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default ReviewForm;
