import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="text-8xl font-bold text-slate-700 font-mono">404</div>
                <h1 className="text-2xl font-bold text-slate-300">Page Not Found</h1>
                <p className="text-slate-500 text-sm">
                    The neural pathway you requested does not exist in this dimension.
                </p>
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium text-sm"
                >
                    Return to Origin
                </Link>
            </div>
        </div>
    );
}
