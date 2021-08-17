import styles from './header.module.scss';
import Link from 'next/link';

export default function Header() {
  return (
    <div className={styles.headerContainer}>
      <div>
        <Link href="/">
          <a>
            <img src="/images/logo.svg" alt="logo" />
          </a>
        </Link>
      </div>
    </div>
  )
}
