import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { MaleSittingWithCards } from "../assets/avatars";
import { CardBack } from "../assets/props";
import { useWindowSize } from "../hooks";
import { Flex } from "../structure";
import { Button } from "../ui";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface BecomeCofounderProps {}

const BecomeCofounder: React.FC<BecomeCofounderProps> = () => {
  const { width } = useWindowSize();
  // const female1 = useRef<SVGSVGElement>(null);
  // const male1 = useRef<SVGSVGElement>(null);
  const male2 = useRef<SVGSVGElement>(null);
  const cardLeft1 = useRef<SVGSVGElement>(null);
  const cardLeft2 = useRef<SVGSVGElement>(null);
  const cardLeft3 = useRef<SVGSVGElement>(null);
  const cardRight1 = useRef<SVGSVGElement>(null);
  const cardRight2 = useRef<SVGSVGElement>(null);
  const cardRight3 = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);

    // gsap.to(female1.current, {
    //   scrollTrigger: {
    //     trigger: female1.current,
    //     scrub: true,
    //   },
    //   y: "8vh",
    // });
    // gsap.to(male1.current, {
    //   scrollTrigger: {
    //     trigger: male1.current,
    //     scrub: true,
    //   },
    //   y: "-10vh",
    // });

    gsap.to(male2.current, {
      scrollTrigger: {
        trigger: male2.current,
        scrub: true,
      },
      y: "-10vh",
    });
    gsap.to(cardLeft1.current, {
      scrollTrigger: {
        trigger: cardLeft1.current,
        scrub: true,
      },
      y: "-5vh",
      x: "-5vw",
      rotation: "-60deg",
    });
    gsap.to(cardLeft2.current, {
      scrollTrigger: {
        trigger: cardLeft2.current,
        scrub: true,
      },
      y: "-5vh",
      x: "-3vw",
      rotation: "-55deg",
    });
    gsap.to(cardLeft3.current, {
      scrollTrigger: {
        trigger: cardLeft3.current,
        scrub: true,
      },
      y: "-5vh",
      x: "-1vw",
      rotation: "-50deg",
    });
    gsap.to(cardRight1.current, {
      scrollTrigger: {
        trigger: cardRight1.current,
        scrub: true,
      },
      y: "-5vh",
      x: "5vw",
      rotation: "60deg",
    });
    gsap.to(cardRight2.current, {
      scrollTrigger: {
        trigger: cardRight2.current,
        scrub: true,
      },
      y: "-5vh",
      x: "3vw",
      rotation: "55deg",
    });
    gsap.to(cardRight3.current, {
      scrollTrigger: {
        trigger: cardRight3.current,
        scrub: true,
      },
      y: "-5vh",
      x: "1vw",
      rotation: "50deg",
    });
  });

  return (
    <section
      className="min-h-screen relative flex flex-col text-black overflow-hidden py-12 md:py-16"
      style={{
        background: "linear-gradient(135deg, #ffb3ba 0%, #ffcccc 50%, #ffd9d9 100%)",
      }}
    >
      {/* Main Content Container */}
      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-4 text-black">People</h1>
          <p className="text-lg md:text-2xl font-semibold text-black">
            Build by the Community and for Community
          </p>
        </div>
        
        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto pb-[35vh] md:pb-[50vh]">
          
          {/* Founders Card */}
          <div className="border-2 border-white bg-black/50 backdrop-blur-sm p-6 md:p-8 rounded-xl text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-white">
              FOUNDERS OF ZO WORLD
            </h3>
            <p className="text-sm md:text-base font-semibold text-white mb-1 md:mb-2">
              TOP TIER MEMBERSHIP
            </p>
            <p className="text-sm md:text-base mb-2 md:mb-3 text-white">
              LIMITED TO 1,111
            </p>
            <p className="text-xs md:text-sm text-white/80 mb-3 md:mb-4">
              are top tier members who get exclusive access, perks and contribute to Zo World
            </p>
            <p className="text-xs md:text-sm text-white/80 mb-4 md:mb-6">
              EXCLUSIVE COMMUNITY OF FOUNDERS, VC, DEGENS, DEVS
            </p>
            <div className="flex justify-center">
              <Link href="/become-a-founder" passHref>
                <Button className="w-full md:w-auto">Claim Founder Spot</Button>
              </Link>
            </div>
          </div>
          
          {/* Citizens Card */}
          <div style={{ background: "#F07850" }} className="p-6 md:p-8 rounded-xl text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-black">
              CITIZENS OF ZO WORLD
            </h3>
            <p className="text-sm md:text-base font-semibold text-black mb-1 md:mb-2">
              COMMUNITY MEMBERSHIP
            </p>
            <p className="text-sm md:text-base mb-2 md:mb-3 text-black font-bold">
              FREE TO GET
            </p>
            <p className="text-xs md:text-sm text-black/80 mb-3 md:mb-4">
              are participants in game of life, attending virtual, IRL events doing quests & more
            </p>
            <p className="text-xs md:text-sm text-black/80 mb-4 md:mb-6">
              ATTEND EVENTS, PARTICIPATE IN ZO WORLD
            </p>
            <div className="flex justify-center">
              <Link href="/" passHref>
                <Button className="w-full md:w-auto bg-black text-white hover:bg-gray-800">
                  Join as Citizen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ANIMATED CHARACTER - Centered at Bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-5">
        <Flex
          col
          items="center"
          className="relative"
        >
          <MaleSittingWithCards
            ref={male2}
            className="absolute z-1"
            style={{
              height: width <= 768 ? "30vh" : "45vh",
              bottom: "0",
            }}
          />
          <CardBack
            ref={cardLeft1}
            className="absolute z-1"
            style={{
              height: width <= 768 ? "6vh" : "10vh",
              bottom: width <= 768 ? "8vh" : "-20vh",
              left: width <= 768 ? "-15vw" : "-10vw",
            }}
          />
          <CardBack
            ref={cardLeft2}
            className="absolute z-1"
            style={{
              height: width <= 768 ? "6vh" : "10vh",
              bottom: width <= 768 ? "18vh" : "-5vh",
              left: width <= 768 ? "-18vw" : "-12vw",
            }}
          />
          <CardBack
            ref={cardLeft3}
            className="absolute z-1"
            style={{
              height: width <= 768 ? "6vh" : "10vh",
              bottom: width <= 768 ? "28vh" : "10vh",
              left: width <= 768 ? "-12vw" : "-8vw",
            }}
          />
          <CardBack
            ref={cardRight1}
            className="absolute z-1"
            style={{
              height: width <= 768 ? "6vh" : "10vh",
              bottom: width <= 768 ? "8vh" : "-20vh",
              right: width <= 768 ? "-15vw" : "-10vw",
            }}
          />
          <CardBack
            ref={cardRight2}
            className="absolute z-1"
            style={{
              height: width <= 768 ? "6vh" : "10vh",
              bottom: width <= 768 ? "18vh" : "-5vh",
              right: width <= 768 ? "-18vw" : "-12vw",
            }}
          />
          <CardBack
            ref={cardRight3}
            className="absolute z-1"
            style={{
              height: width <= 768 ? "6vh" : "10vh",
              bottom: width <= 768 ? "28vh" : "10vh",
              right: width <= 768 ? "-12vw" : "-8vw",
            }}
          />
        </Flex>
      </div>
    </section>
  );
};

export default BecomeCofounder;
