import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — 360Fit",
  description: "360Fit privacy policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060d10] text-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-white/60 mb-4">
          This is a placeholder privacy policy. Replace this with your actual privacy policy before production deployment.
        </p>
        <p className="text-white/60">
          Last updated: {new Date().toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
}
