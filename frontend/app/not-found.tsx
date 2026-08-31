import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#06080e] text-slate-200 p-4 text-center">
      <h2 className="text-3xl font-bold font-orbitron text-cyan-400 mb-2">404 - Not Found</h2>
      <p className="text-slate-400 mb-6">The requested page could not be found.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-all shadow-lg shadow-cyan-500/20"
      >
        Return to WAR AI Hub
      </Link>
    </div>
  );
}
