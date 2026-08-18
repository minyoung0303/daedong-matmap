import styles from './LoadingSpinner.module.css';

/** 로딩 표시. 스크린리더에는 label을 읽어준다. */
function LoadingSpinner({ label = '불러오는 중' }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export default LoadingSpinner;
