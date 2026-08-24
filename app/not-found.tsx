import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        The short drama you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" style={{ color: '#6366f1', textDecoration: 'underline' }}>
        ← Back to Home
      </Link>
    </div>
  );
}
