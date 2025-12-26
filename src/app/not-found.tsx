import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container" style={{ padding: "100px 0", textAlign: "center" }}>
      <h1 style={{ fontSize: "48px", marginBottom: "24px" }}>404</h1>
      <h2 style={{ fontSize: "24px", marginBottom: "24px" }}>Page Not Found</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "40px" }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn btn-primary">
        Return to Home
      </Link>
    </main>
  );
}
