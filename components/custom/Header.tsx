import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { AiFillHome, AiOutlineMenu } from "react-icons/ai";
import { FaBed, FaCalendar, FaPlane } from "react-icons/fa";
import Button from "@/components/custom/Button";
import supabase from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/useAuthStore";

const MenuItems = [
  {
    label: "Top",
    icon: <AiFillHome />,
    href: "/"
  },
  {
    label: "Schedule",
    icon: <FaCalendar />,
    href: "/schedule"
  },
  {
    label: "Transport",
    icon: <FaPlane />,
    href: "/transport"
  },
  {
    label: "Hotel",
    icon: <FaBed />,
    href: "/hotel"
  }
];

const MenuLabel = ({
  icon,
  label,
  href
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) => {
  return (
    <Link
      href={href}
      className="flex gap-[1rem] cursor-pointer hover:text-gray-500 transition-colors duration-200"
    >
      <div className="text-[1.6rem]">{icon}</div>
      <p className="text-[1.2rem] font-bold">{label}</p>
    </Link>
  );
};

const Menu = ({
  isOpen,
  onClose,
  onLoggedOut
}: {
  isOpen: boolean;
  onClose: () => void;
  onLoggedOut: () => void;
}) => {
  const userEmail = useAuthStore((s) => s.user?.email ?? null);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    onLoggedOut();
  };

  return (
    <div
      className={
        "flex flex-col justify-between pt-[6rem] pb-[3.2rem] px-[2.4rem] w-[26rem] h-[100vh] fixed top-0 right-0 z-20 transform transition-transform duration-300 ease-out bg-white " +
        (isOpen
          ? "translate-x-0 pointer-events-auto"
          : "translate-x-full pointer-events-none invisible")
      }
      aria-hidden={!isOpen}
    >
      <div>
        <h1 className="text-center font-bold mb-[4rem]">Sample Trip Title</h1>

        <div className="flex flex-col gap-[3.2rem]">
          {MenuItems.map((item) => (
            <MenuLabel
              key={item.label}
              icon={item.icon}
              label={item.label}
              href={item.href}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center items-center gap-[0.8rem]">
        {userEmail && <p>{userEmail}</p>}
        <Button
          type="button"
          onClick={handleLogout}
          className="bg-white text-black border border-gray-300 mx-auto"
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="h-[6.4rem] flex justify-between items-center px-[1.6rem]">
      <h1 className="text-[1.4rem] font-bold">Trip Drop</h1>
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
        <Menu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onLoggedOut={() => router.replace("/auth/login")}
        />
      )}
    </div>
  );
}
