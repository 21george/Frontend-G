"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Product", href: "/" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Support", href: "/support" },
];

export default function RegistrationNav() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl"
    >
      {/* Ambient glow behind the nav */}
      <div
        aria-hidden
        className="absolute -inset-2 rounded-[28px] opacity-40 blur-2xl pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(163,230,53,0.18), transparent 70%)",
        }}
      />

      <nav className="relative flex items-center justify-between h-14 rounded-[18px] bg-[#080c0c]/85 backdrop-blur-2xl border border-white/[0.07] shadow-[0_8px_32px_-6px_rgba(0,0,0,0.6)]">
        {/* Top sheen highlight */}
        <div
          aria-hidden
          className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* LEFT: Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 pl-4 group"
          style={{ textDecoration: "none" }}
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#132E35] to-[#091215] ring-1 ring-white/10 shadow-inner overflow-hidden">
            {/* Logo mark — hexagonal reticle */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="relative z-10"
            >
              <path
                d="M12 2l8.66 5v10L12 22 3.34 17V7L12 2z"
                stroke="url(#navLogoGrad)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2.5" fill="#a3e635" />
              <defs>
                <linearGradient id="navLogoGrad" x1="3" y1="2" x2="21" y2="22">
                  <stop stopColor="#a3e635" />
                  <stop offset="1" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            {/* Active dot */}
            <span className="absolute top-[2px] right-[2px] block h-1 w-1 rounded-full bg-[#a3e635] ring-1 ring-[#080c0c]" />
          </div>

          <span
            className="hidden sm:inline text-[15px] font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CoachPro
          </span>
        </Link>

        {/* CENTER: Links */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onMouseEnter={() => setHovered(link.label)}
              onMouseLeave={() => setHovered(null)}
              className="relative px-3 py-1.5 text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200"
              style={{ textDecoration: "none" }}
            >
              {link.label}
              {hovered === link.label && (
                <motion.span
                  layoutId="regNavDot"
                  className="absolute left-1/2 -bottom-0.5 -translate-x-1/2 w-1 h-1 rounded-full bg-[#a3e635] shadow-[0_0_6px_rgba(163,230,53,0.6)]"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* RIGHT: CTA */}
        <Link
          href="/auth/login"
          className="mr-3 inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-white text-[#080c0c] text-[13px] font-bold hover:scale-105 active:scale-95 transition-transform duration-200"
          style={{ textDecoration: "none" }}
        >
          Sign In
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60" strokeWidth={2.5} />
        </Link>
      </nav>
    </motion.header>
  );
}
