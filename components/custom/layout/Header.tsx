import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { AiOutlineMenu } from "react-icons/ai";
import HeaderMenu from "@/components/custom/layout/HeaderMenu";
import { useAuthStore } from "@/store/useAuthStore";

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="h-[6.4rem] flex justify-between items-center px-[1.6rem]">
      <h1>
        <Link href="/" className="text-[1.4rem] font-bold">
          Trip Drop
        </Link>
      </h1>
      {isAuthenticated && (
        <div
          onClick={handleMenuClick}
          className="text-[2.4rem] font-bold flex items-center gap-[1.2rem] cursor-pointer"
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
          className="fixed inset-0 bg-black/20 z-10"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      {isAuthenticated && (
        <HeaderMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onLoggedOut={() => router.replace("/auth/login")}
        />
      )}
    </div>
  );
}
