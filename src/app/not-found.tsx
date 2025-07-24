export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <img 
            src="/Z_to_House.gif" 
            alt="Zo House" 
            className="h-16 w-auto mx-auto opacity-90"
          />
        </div>
        <h1 className="text-4xl font-bold text-black mb-4">404</h1>
        <p className="text-gray-600 mb-8">This page could not be found.</p>
        <a 
          href="/" 
          className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Back to Events Map
        </a>
      </div>
    </div>
  );
} 