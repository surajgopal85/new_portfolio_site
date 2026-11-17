import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="page">
      <p className="eyebrow">404</p>
      <h1>Wrong door</h1>
      <p className="lede">Nothing lives at this address.</p>
      <Link href="/" className="block-button">
        Back to the office
      </Link>
    </main>
  )
}
