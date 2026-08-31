import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WAR AI — Your Personal AI Computer Agent',
  description: 'Next-Generation Autonomous Windows Computer Control Agent with Multilingual Voice & Chat capabilities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#06080e] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
