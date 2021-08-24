import Link from 'next/link'
import React from 'react'

import styles from './button.module.scss';

export default function  ExitPreviewButton() {
  return (
    <div className={styles.exitButton}>
      {/* {children} */}
      <Link href="/api/exit-preview">
        <a>
          <strong>Exit Preview mode</strong>
        </a>
      </Link>
    </div>
  )
}