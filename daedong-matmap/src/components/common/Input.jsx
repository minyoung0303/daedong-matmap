import styles from './Input.module.css';

/**
 * 공통 입력창.
 * 시각적 라벨을 두지 않는 자리라 aria-label을 필수로 받는다.
 */
function Input({ ariaLabel, className = '', ...rest }) {
  return <input className={[styles.input, className].filter(Boolean).join(' ')} aria-label={ariaLabel} {...rest} />;
}

export default Input;
