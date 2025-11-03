'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-bold mb-4">App crashed</h1>
            <p className="text-sm opacity-80 mb-6">{error.message}</p>
            <button onClick={reset} className="bg-white text-black px-4 py-2 rounded-md">Reload</button>
          </div>
        </div>
      </body>
    </html>
  );
}
