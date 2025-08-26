import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center p-4">
      <div className="text-center max-w-sm mx-auto">
        <div className="mb-6 sm:mb-8">
          <Image 
            src="/Z_to_House.gif" 
            alt="Zo House" 
            width={64}
            height={64}
            className="h-12 w-auto mx-auto opacity-90 sm:h-16"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3 sm:mb-4">404</h1>
        <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base px-4">This page could not be found.</p>
        <Link 
          href="/" 
          className="inline-block bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base"
        >
          Back to Events Map
        </Link>
      </div>
    </div>
  );
} 