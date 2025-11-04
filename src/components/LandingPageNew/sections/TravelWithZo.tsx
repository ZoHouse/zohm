import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import {
  FemaleSittingLog,
  FemaleWithMarshmellow,
  MaleSittingLog,
} from "../assets/avatars";
import { Fields2, Fields2Desktop } from "../assets/backgrounds";
import { Bonfire1 } from "../assets/props";
import { useWindowSize } from "../hooks";
import { Flex } from "../structure";
import { Button } from "../ui";

const TravelWithZo: React.FC = () => {
  const { width } = useWindowSize();

  const male1 = useRef<SVGSVGElement>(null);
  const female1 = useRef<SVGSVGElement>(null);
  const female2 = useRef<SVGSVGElement>(null);
  const fire = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(male1.current, {
      scrollTrigger: {
        scrub: true,
        trigger: male1.current,
      },
      x: "-5vw",
    });
    gsap.to(female1.current, {
      scrollTrigger: {
        scrub: true,
        trigger: female1.current,
      },
      x: "5vw",
    });
    gsap.to(female2.current, {
      scrollTrigger: {
        scrub: true,
        trigger: female2.current,
      },
      y: "-5vh",
    });

    gsap.to(fire.current, {
      scrollTrigger: {
        scrub: true,
        trigger: fire.current,
      },
      scale: 1.2,
      y: "5vh",
    });
  });

  return (
    <section
      className="min-h-screen relative flex flex-col text-black overflow-hidden py-12 md:py-16 px-4"
      style={{
        background:
          "linear-gradient(360deg, #FCC521 -63.02%, #F6C526 -37.85%, #E6C433 -16.32%, #CAC34A 17.64%, #A4C269 50.75%, #88C180 66.22%, #0A7F3F 91.76%, #0A7F3F 100%)",
      }}
    >
      {/* Main Content Container */}
      <div className="w-full max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-4 text-black">Parties</h1>
          <p className="text-lg md:text-2xl font-semibold text-black mb-4 md:mb-6">
            Celebrations of coherence
          </p>
          <p className="text-sm md:text-base text-black/80 max-w-3xl mx-auto">
            Parties are where coherence emerges. Through quests, events, and shared experiences, frequencies synchronize, creating moments where digital communities activate in physical space. These celebrations are the rituals that bind the network, transforming individual intention into collective consciousness and making the protocol pulse with life.
          </p>
        </div>
        
        {/* Animation Section */}
        <div className="relative flex justify-center items-end mb-8 md:mb-12" style={{ minHeight: "40vh" }}>
          <Bonfire1
            ref={fire}
            className="absolute bottom-0 z-3"
            style={{ height: width <= 768 ? "16vh" : "24vh" }}
          />
          <Flex items="end" className="relative z-2">
            <FemaleSittingLog
              ref={female1}
              style={{ height: width <= 768 ? "30vh" : "40vh" }}
            />
            <FemaleWithMarshmellow
              ref={female2}
              className="relative"
              style={{ height: width <= 768 ? "30vh" : "40vh", bottom: "2vh" }}
            />
            <MaleSittingLog
              ref={male1}
              style={{ height: width <= 768 ? "30vh" : "40vh" }}
            />
          </Flex>
        </div>
      </div>
    </section>
  );
};

export default TravelWithZo;
