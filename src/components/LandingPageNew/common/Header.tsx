'use client';

import Link from "next/link";
import React, { useState } from "react";
import { BurgerMenu } from ".";
import { Menu, Zo } from "../assets/icons";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section>
      <header className="fixed top-0 left-0 right-0 w-full mx-auto z-50 text-white flex items-center p-4 md:px-8 justify-between">
        <Link href="/">
          <Zo className="w-10 h-10 cursor-pointer" fill="white" />
        </Link>
        <nav className="flex items-center flex-grow justify-end">
          <Menu
            className="h-6 w-6 cursor-pointer"
            stroke="white"
            onClick={() => setMenuOpen(true)}
          />
        </nav>
      </header>
      {menuOpen && <BurgerMenu closeMenu={() => setMenuOpen(false)} />}
    </section>
  );
};

export default Header;
