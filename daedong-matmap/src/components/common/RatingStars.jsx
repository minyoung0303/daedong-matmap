import styles from './RatingStars.module.css';

const SCORES = [1, 2, 3, 4, 5];

/**
 * 별점 표시 / 입력 컴포넌트.
 *
 * onChange를 넘기면 입력 모드(라디오 그룹)로, 넘기지 않으면 읽기 전용으로 동작한다.
 * 입력 모드에서는 라디오를 쓰기 때문에 키보드 화살표로도 점수를 바꿀 수 있다.
 */
function RatingStars({ value = 0, onChange, name = 'rating', size = 'md' }) {
  const readOnly = typeof onChange !== 'function';

  if (readOnly) {
    return (
      <span className={`${styles.readOnly} ${styles[size]}`} aria-label={`별점 ${value}점`}>
        {SCORES.map((score) => (
          <span key={score} className={score <= Math.round(value) ? styles.filled : styles.empty} aria-hidden="true">
            ★
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={`${styles.input} ${styles[size]}`} role="radiogroup" aria-label="별점 선택">
      {SCORES.map((score) => (
        <label key={score} className={styles.star}>
          <input
            type="radio"
            name={name}
            value={score}
            checked={value === score}
            onChange={() => onChange(score)}
            className={styles.radio}
          />
          <span className={score <= value ? styles.filled : styles.empty} aria-hidden="true">
            ★
          </span>
          <span className={styles.srOnly}>{score}점</span>
        </label>
      ))}
    </span>
  );
}

export default RatingStars;
