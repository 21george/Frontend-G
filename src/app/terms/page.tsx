import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — 360Fit",
  description: "360Fit terms of service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#060d10] text-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
        <p className="text-white/60 mb-4">
          This is a placeholder terms of service page. Replace this with your actual terms before production deployment.
        </p>
        <p className="text-white/60">
          Last updated: {new Date().toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
}
