import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AiOutlineMenu } from "react-icons/ai";
import { useAuthStore } from "@/store/useAuthStore";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="h-[6.4rem] flex justify-between items-center px-[2.4rem] lg:px-[4.8rem]">
      <h1 className="">
        <Link href="/" className="text-[1.4rem] font-bold">
          Trip Drop
        </Link>
      </h1>
      <Link
        href="/"
        className="hidden lg:block text-[1.4rem] font-bold hover:text-black/25 transition-all duration-300"
      >
        My Trips
      </Link>
      {isAuthenticated && (
        <div
          onClick={handleMenuClick}
          className="text-[2.4rem] font-bold flex items-center gap-[1.2rem] cursor-pointer lg:hidden"
        >
          <Image
            src="/dummy-user.png"
            alt="logo"
            width={28}
            height={28}
            className="rounded-full border border-gray-300"
          />
          <AiOutlineMenu />
        </div>
      )}
      {isAuthenticated && isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-10 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}
