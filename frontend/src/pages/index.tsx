import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to English Foundation
        </h1>
        <p className={styles.description}>
          Your platform for English language learning
        </p>
        <div className={styles.grid}>
          <div className={styles.card} onClick={() => router.push('/login')}>
            <h2>Login &rarr;</h2>
            <p>Sign in to your account to continue learning.</p>
          </div>
          <div className={styles.card} onClick={() => router.push('/register')}>
            <h2>Register &rarr;</h2>
            <p>Create a new account to start your journey.</p>
          </div>
        </div>
      </main>
    </div>
  );
} 