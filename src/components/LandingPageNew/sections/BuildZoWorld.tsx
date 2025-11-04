import Image from "next/image";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useWindowSize } from "../hooks";
import { Flex } from "../structure";
import { Button } from "../ui";

interface BuildZoWorldProps {}

const BuildZoWorld: React.FC<BuildZoWorldProps> = () => {
  const { width } = useWindowSize();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const countryCards = [
    { name: "India", image: "/assets/Country-card_India.gif" },
    { name: "Japan", image: "/assets/Country-Cards_Japan.gif" },
    { name: "El Salvador", image: "/assets/Country-Cards_El-Salvador.gif" },
  ];

  // Handle swipe navigation on mobile
  useEffect(() => {
    if (!scrollContainerRef.current || width > 768) return;

    const container = scrollContainerRef.current;
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swipe left - next card
          setCurrentIndex((prev) => (prev + 1) % countryCards.length);
        } else {
          // Swipe right - previous card
          setCurrentIndex((prev) => (prev - 1 + countryCards.length) % countryCards.length);
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [width, countryCards.length]);

  // Scroll to current card on mobile
  useEffect(() => {
    if (!scrollContainerRef.current || width > 768) return;
    
    const container = scrollContainerRef.current;
    const cardWidth = container.clientWidth;
    container.scrollTo({
      left: currentIndex * cardWidth,
      behavior: 'smooth'
    });
  }, [currentIndex, width]);

  return (
    <section
      className="min-h-screen relative flex flex-col text-black overflow-hidden py-12 md:py-16 px-4"
      style={{
        background: "linear-gradient(135deg, #fff5f5 0%, #ffe8e8 50%, #ffe0e0 100%)",
      }}
    >
      {/* Main Content Container */}
      <div className="w-full max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-4 text-black">Places</h1>
          <p className="text-lg md:text-2xl font-semibold text-black mb-4 md:mb-6">
            Nodes of possibility
          </p>
          <p className="text-sm md:text-base text-black/80 max-w-3xl mx-auto">
            To awaken the cities' consciousness, we need physical nodes. Culture houses, hacker spaces, cafes, and co-living hubs 
            where the digital meets the physical. These nodes are the awakening points, 
            Each node is a heartbeat in the city's body, transforming intention into action 
            and connecting the distributed protocol to physical reality.
          </p>
        </div>
        
        {/* Country Cards - Swipeable on Mobile, Grid on Desktop */}
        <div className="mb-8 md:mb-12">
          {/* Mobile: Swipeable Stack */}
          <div
            ref={scrollContainerRef}
            className="md:hidden flex overflow-x-hidden snap-x snap-mandatory"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {countryCards.map((country, index) => (
              <div
                key={country.name}
                className="relative flex-shrink-0 w-full snap-center px-2"
              >
                <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm">
                  <Image
                    src={country.image}
                    alt={`${country.name} Country Card`}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-lg font-bold text-center">
                      {country.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: Dots Indicator */}
          <div className="md:hidden flex justify-center gap-2 mt-4">
            {countryCards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-8 bg-black' : 'w-2 bg-black/30'
                }`}
                aria-label={`Go to ${countryCards[index].name}`}
              />
            ))}
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {countryCards.map((country, index) => (
              <div
                key={country.name}
                className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm">
                  <Image
                    src={country.image}
                    alt={`${country.name} Country Card`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 33vw, 30vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-base md:text-lg font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {country.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuildZoWorld;
