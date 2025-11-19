import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AiOutlineMenu } from "react-icons/ai";
import TripNavigation from "@/components/custom/layout/TripNavigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const tripId = router.query.tripId as string | undefined;

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    console.log(isAuthenticated);
  }, [isAuthenticated]);

  return (
    <>
      <div className="h-[6.4rem] flex justify-between items-center px-[2.4rem] lg:px-[4.8rem]">
        <h1 className="">
          <Link href="/" className="text-[1.4rem] font-bold">
            Trip Drop
          </Link>
        </h1>
        {isAuthenticated && (
          <Link
            href="/"
            className="hidden lg:block text-[1.4rem] font-bold hover:text-black/25 transition-all duration-300"
          >
            My Trips
          </Link>
        )}

        {/* sm, md用のメニューボタン */}
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
            onClick={handleCloseMenu}
          />
        )}
      </div>
      {/* sm, md用のサイドメニュー */}
      {isAuthenticated && (
        <div
          className={cn(
            "fixed top-0 right-0 w-[26rem] h-full bg-white z-20 lg:hidden overflow-y-auto",
            "transform transition-transform duration-300 ease-in-out",
            isMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="pt-[6.4rem] px-[2.4rem] pb-[3.2rem]">
            <Link
              href="/"
              onClick={handleCloseMenu}
              className="text-[1.4rem] font-bold hover:text-black/25 transition-all duration-300 block mb-[3.2rem]"
            >
              My Trips
            </Link>
            {tripId && (
              <TripNavigation
                isOpen={isMenuOpen}
                onClose={handleCloseMenu}
                embedded
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
