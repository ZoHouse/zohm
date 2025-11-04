'use client';

import Link from "next/link";
import React from "react";
import {
  Close,
  Instagram,
  LinkedIn,
  TwitterFilled,
  Zo,
} from "../assets/icons";
import { Flex } from "../structure";

interface BurgerMenuProps {
  closeMenu: React.MouseEventHandler;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ closeMenu }) => {
  return (
    <Flex
      col
      className="fixed inset-y-0 right-0 w-screen px-4 pt-4 pb-10 overflow-y-auto text-white z-[70] md:max-w-sm md:px-10 bg-[#ea5f52]"
    >
      <Flex justify="end">
        <Close
          className="w-6 h-6 cursor-pointer"
          stroke="white"
          onClick={closeMenu}
        />
      </Flex>
      <Link href="/" onClick={closeMenu}>
        <Zo
          className="w-16 h-16 mx-auto my-5 cursor-pointer"
          fill="white"
        />
      </Link>
      <Link href="/become-a-founder" onClick={closeMenu}>
        <h1
          className="mx-auto my-5 text-xl font-bold no-underline cursor-pointer md:text-2xl hover:underline"
        >
          Become a Cofounder
        </h1>
      </Link>
      <Link href="/build-zo" onClick={closeMenu}>
        <h1
          className="mx-auto my-5 text-xl font-bold no-underline cursor-pointer md:text-2xl hover:underline"
        >
          Futarcity
        </h1>
      </Link>
      <Link href="/travel-with-zo" onClick={closeMenu}>
        <h1
          className="mx-auto my-5 text-xl font-bold no-underline cursor-pointer md:text-2xl hover:underline"
        >
          Actions
        </h1>
      </Link>
      <Link href="/masterplan" onClick={closeMenu}>
        <h1
          className="mx-auto my-5 text-xl font-bold no-underline cursor-pointer md:text-2xl hover:underline"
        >
          Masterplan
        </h1>
      </Link>
      <Flex items="center" justify="center" className="mt-12">
        <a
          href="https://twitter.zo.xyz/"
          target="_blank"
          rel="noreferrer"
          className="mx-4"
        >
          <TwitterFilled className="w-6 h-6" fill="white" />
        </a>
        <a
          href="https://instagram.zo.xyz/"
          target="_blank"
          rel="noreferrer"
          className="mx-4"
        >
          <Instagram className="w-6 h-6" />
        </a>
        <a
          href="https://linkedin.zo.xyz/"
          target="_blank"
          rel="noreferrer"
          className="mx-4"
        >
          <LinkedIn className="w-6 h-6" fill="white" />
        </a>
      </Flex>
    </Flex>
  );
};

export default BurgerMenu;
