import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060d10]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#a3e635] mb-4">404</h1>
        <p className="text-white/60 mb-6">This page could not be found.</p>
        <Link
          href="/dashboard"
          className="text-[#a3e635] hover:text-[#bef264] font-semibold transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
