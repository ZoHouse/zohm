'use client';

interface TransitionScreenProps {
  message?: string;
  progress?: number;
}

/**
 * TransitionScreen Component
 * 
 * Shown during onboarding completion → map transition
 * Replaces loading screen flashing with smooth progress indicator
 */
export default function TransitionScreen({ 
  message = 'Entering Zo World...', 
  progress = 0 
}: TransitionScreenProps) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        
        {/* Spinning Logo or Icon */}
        <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        
        {/* Message */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-white animate-pulse">
            {message}
          </h2>
          
          {/* Progress Bar */}
          {progress > 0 && (
            <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          {/* Subtext */}
          <p className="text-sm text-white/60">
            {progress < 30 && 'Saving your progress...'}
            {progress >= 30 && progress < 60 && 'Loading your profile...'}
            {progress >= 60 && progress < 90 && 'Preparing your map...'}
            {progress >= 90 && 'Almost ready...'}
          </p>
        </div>
        
        {/* Magical particles effect (optional) */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

