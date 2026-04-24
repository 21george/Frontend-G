import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CoachPro — All-in-One Fitness Coaching Platform',
  description:
    'Manage clients, build workout plans, track nutrition, and grow your coaching business. Start your 14-day free Pro trial today.',
  keywords: [
    'coaching platform',
    'fitness coaching',
    'personal trainer software',
    'client management',
    'workout builder',
    'nutrition tracking',
    'coaching business',
  ],
  robots: 'index, follow',
  openGraph: {
    title: 'CoachPro — All-in-One Fitness Coaching Platform',
    description:
      'Professional coaching management for modern trainers. Clients, workouts, nutrition & analytics in one place.',
    url: 'https://coachpro.app',
    siteName: 'CoachPro',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoachPro — Coaching Platform',
    description:
      'Manage clients, workouts, nutrition & analytics in one place. 14-day free trial.',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
