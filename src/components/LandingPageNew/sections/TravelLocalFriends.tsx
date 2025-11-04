import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import React, { useEffect, useRef } from "react";
import {
  FemaleBottom1,
  FemaleLeftFull1,
  MaleRightFull1,
} from "../assets/avatars";
import { Globe, Sky } from "../assets/props";
import { useWindowSize } from "../hooks";

interface TravelLocalFriendsProps {}

const TravelLocalFriends: React.FC<TravelLocalFriendsProps> = () => {
  const { isMobile } = useWindowSize();

  const globe = useRef<SVGSVGElement>(null);
  const sky = useRef<SVGSVGElement>(null);
  const female1 = useRef<SVGSVGElement>(null);
  // const female2 = useRef<SVGSVGElement>(null);
  const male1 = useRef<SVGSVGElement>(null);
  const text = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);

    if (!isMobile) {
      gsap.to(globe.current, {
        scrollTrigger: {
          trigger: globe.current,
          scrub: true,
        },
        rotate: "540deg",
      });
      gsap.to(sky.current, {
        scrollTrigger: {
          trigger: sky.current,
          scrub: true,
        },
        scale: isMobile ? 2 : 1.5,
      });
      gsap.to(text.current, {
        scrollTrigger: {
          trigger: globe.current,
          scrub: true,
        },
        y: "-20vh",
      });
    }
    gsap.to(female1.current, {
      scrollTrigger: {
        trigger: female1.current,
        scrub: true,
      },
      y: "20vh",
    });
    // gsap.to(female2.current, {
    //   scrollTrigger: {
    //     trigger: female2.current,
    //     scrub: true,
    //   },
    //   y: "5vh",
    // });
    gsap.to(male1.current, {
      scrollTrigger: {
        trigger: male1.current,
        scrub: true,
      },
      y: "20vh",
    });
  }, [isMobile]);

  return (
    <section
      className="h-screen relative px-4 flex flex-col md:flex-row items-center justify-start md:justify-start w-full overflow-hidden"
      style={{
        background: "#28735D",
      }}
    >
      <div className="md:relative md:w-1/2 flex flex-col items-center justify-center">
        <Sky
          ref={sky}
          className="absolute bottom-0 md:bottom-auto"
          style={{
            height: isMobile ? "auto" : "30vw",
          }}
        />
        <Globe
          ref={globe}
          className="absolute"
          style={{
            height: "75vh",
            bottom: "-37.5vh",
          }}
        />
      </div>
      <div
        ref={text}
        className="text-white text-center max-w-2xl px-4 w-full"
        style={{ 
          marginBottom: isMobile ? "0" : "0",
          marginTop: isMobile ? "0" : "0"
        }}
      >
        <h2 className="text-2xl md:text-4xl font-bold mb-4">Zo Zo Zo</h2>
        <p className="text-lg md:text-xl mb-4 font-semibold">
          Bridging digital communities to physical actions.
        </p>
        <p className="text-sm md:text-base mb-6 opacity-90">
          12 years of research, 100+ nodes, and over 1 million citizens later, we've cracked the code to your best life.
        </p>
        
        <div className="space-y-4">
          <div className="text-center">
            <span className="font-bold text-base md:text-lg">People:</span>
            <span className="text-sm md:text-base"> Founders, creators, dreamers, and citizens turning intention into action.</span>
          </div>
          
          <div className="text-center">
            <span className="font-bold text-base md:text-lg">Places:</span>
            <span className="text-sm md:text-base"> Nodes of possibilities such as culture houses, hacker spaces, and co-living hubs where the digital meets the physical.</span>
          </div>
          
          <div className="text-center">
            <span className="font-bold text-base md:text-lg">Parties:</span>
            <span className="text-sm md:text-base"> Celebrations of coherence where communities sync, stories merge, and the network comes alive.</span>
          </div>
        </div>
      </div>
      <FemaleLeftFull1
        ref={female1}
        className="absolute left-0 z-1 md:hidden block"
        style={{ width: "25vw", bottom: "10vh" }}
      />
      <FemaleBottom1
        className="absolute bottom-0 z-1 hidden md:block"
        style={{ height: "40vh", right: "10vh" }}
      />
      <MaleRightFull1
        ref={male1}
        className="absolute right-0 z-1"
        style={{
          width: isMobile ? "35vw" : "auto",
          height: isMobile ? "auto" : "50vh",
          bottom: isMobile ? "10vh" : "60vh",
        }}
      />
    </section>
  );
};

export default TravelLocalFriends;
