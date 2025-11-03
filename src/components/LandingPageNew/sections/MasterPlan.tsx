import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import {
  ConfusedMale1,
  FemaleFull2,
  GeekyMale1,
  MaleFullThumbs1,
} from "../assets/avatars";
import { Fields1, Fields1Desktop } from "../assets/backgrounds";
import { FourZobusWithDesk, HelpDesk } from "../assets/props";
import { useWindowSize } from "../hooks";
import { Flex } from "../structure";
import { Button } from "../ui";

interface MasterPlanProps {}

const MasterPlan: React.FC<MasterPlanProps> = () => {
  const { width } = useWindowSize();

  const female1 = useRef<SVGSVGElement>(null);
  const male1 = useRef<SVGSVGElement>(null);
  const male2 = useRef<SVGSVGElement>(null);
  const male3 = useRef<SVGSVGElement>(null);
  const desk = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(male1.current, {
      scrollTrigger: {
        scrub: true,
        trigger: male1.current,
      },
      y: "10vh",
    });
    gsap.to(female1.current, {
      scrollTrigger: {
        scrub: true,
        trigger: female1.current,
      },
      y: "10vh",
    });
    gsap.to(male2.current, {
      scrollTrigger: {
        scrub: true,
        trigger: male2.current,
      },
      y: "10vh",
    });
    gsap.to(male3.current, {
      scrollTrigger: {
        scrub: true,
        trigger: male3.current,
      },
      y: "10vh",
    });
    gsap.to(desk.current, {
      scrollTrigger: {
        scrub: true,
        trigger: desk.current,
      },
      y: "10vh",
    });
  });

  // Ensure ScrollTrigger recalculates on viewport changes (mobile rotations/resizes)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Give layout a moment to settle then refresh
    const id = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 50);
    return () => clearTimeout(id);
  }, [width]);
  return (
    <section
      className="min-h-screen relative flex flex-col text-black overflow-hidden py-12 md:py-16 px-4"
      style={{
        background:
          "linear-gradient(0.43deg, #C3FCF1 -29.45%, #C2FBF4 -14.79%, #BFF6E9 -3%, #BBEFD7 6.56%, #B5E5BC 19.63%, #ADD79B 29.83%, #A3C771 42.89%, #97B441 51.82%, #8BA00D 99.63%)",
      }}
    >
      {/* Main Content Container */}
      <div className="w-full max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-4 text-black">Masterplan</h1>
          <p className="text-lg md:text-2xl font-semibold text-black mb-4 md:mb-6">
            Live to Earn
          </p>
          <p className="text-sm md:text-base text-black/80 max-w-3xl mx-auto">
            A master plan to tune into Zo World, a world where everyone follows their heart. Zo is your signal in the noise, a beacon that connects us to something greater. Through this framework, we coordinate around shared values, align incentives with intention, guiding us toward collective consciousness.
          </p>
        </div>
        
        {/* Animation Section */}
        <div className="relative flex justify-center items-end mb-8 md:mb-12" style={{ minHeight: "40vh" }}>
          <FourZobusWithDesk 
            className="w-full max-w-4xl h-auto pointer-events-none" 
            style={{ height: width <= 768 ? "30vh" : "50vh" }}
          />
        </div>
        
        {/* CTA Section */}
        <div className="text-center">
          <Link href="/masterplan" passHref>
            <Button className="px-8 py-3 text-base md:text-lg">
              Read the Masterplan
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MasterPlan;
