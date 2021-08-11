import Image from 'next/image';
import Link from 'next/link';

// import LogoImg from "../../../public/images/logo.svg";

import styles from './header.module.scss';

export default function Header() {
  return (
    <div className={styles.headerContainer}>
      <Link href="/" >
        {/* <Image src={LogoImg} alt="logo" width={239} height={27} /> */}
        Logo Here
      </Link>
    </div>
  )
}
