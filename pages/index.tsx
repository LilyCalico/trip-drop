import { isAfter, isSameDay, parseISO, startOfDay } from "date-fns";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import Button from "@/components/custom/button/Button";
import CardTrip from "@/components/custom/cards/CardTrip";
import Input from "@/components/custom/Input";
import PageWrapper from "@/components/custom/PageWrapper";
import Spinner from "@/components/custom/Spinner";
import { useCheckProfile } from "@/hooks/profile/useCheckProfile";
import { useUpdateProfile } from "@/hooks/profile/useUpdateProfile";
import supabase from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useTripsStore } from "@/store/useTripsStore";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);
  const authLoading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clear);
  const setAuthLoading = useAuthStore((s) => s.setLoading);
  const { checkProfile } = useCheckProfile();
  const { updateProfile, error: updateProfileError } = useUpdateProfile();
  const tripsLoading = useTripsStore((s) => s.loading);
  const trips = useTripsStore((s) => s.trips);
  const clearTrips = useTripsStore((s) => s.clearTrips);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // プロフィールに名前の設定がなかったらモーダルを表示
  useEffect(() => {
    if (!session?.user?.id) return;

    const handleCheckProfile = async () => {
      const data = await checkProfile();

      if (data?.isNameNull) {
        setShowNameModal(true);
      }
    };

    handleCheckProfile();
  }, [session?.user?.id, checkProfile]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 20 || !session?.user) {
      if (trimmed.length > 20)
        setNameError("Please enter a name within 20 characters.");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(name);

      if (updateProfileError) {
        console.error("Error updating profile");
      } else {
        setShowNameModal(false);
        router.replace("/", undefined, { shallow: true });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };
  // トリップを Upcoming と Past に分類
  const { upcomingTrips, pastTrips } = useMemo(() => {
    if (!trips) {
      return { upcomingTrips: [], pastTrips: [] };
    }

    const today = startOfDay(new Date());
    const upcoming: typeof trips = [];
    const past: typeof trips = [];

    trips.forEach((trip) => {
      if (trip.endAt) {
        const endDate = startOfDay(parseISO(trip.endAt));
        if (isAfter(endDate, today) || isSameDay(endDate, today)) {
          upcoming.push(trip);
        } else {
          past.push(trip);
        }
      } else {
        // endAt がない場合は Past に分類
        past.push(trip);
      }
    });

    return { upcomingTrips: upcoming, pastTrips: past };
  }, [trips]);

  // ログイン確認が終わっていない、または未ログインなら描画しない
  if (authLoading || !isAuthenticated) {
    return null;
  }

  // 旅情報のGET中はローディングスピナーを表示する
  if (tripsLoading) {
    return <Spinner />;
  }

  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      clearAuth();
      clearTrips();
      setLogoutLoading(false);
      setAuthLoading(false);
      router.push("/auth/login").catch((err) => {
        console.error("Failed to navigate after logout:", err);
      });
    }
  };

  return (
    <PageWrapper>
      <div>
        <h1
          className={cn(
            "font-family-figtree font-semibold",
            "text-[2.4rem] lg:text-[3rem]",
            "mt-[2.4rem] mb-[4.8rem] lg:mt-[4.8rem] lg:mb-[5.6rem]",
          )}
        >
          Your Trips
        </h1>

        <p className="text-[1.2rem] font-family-figtree uppercase mb-[1.2rem]">
          Upcoming
        </p>

        <div className="flex flex-col items-center justify-center w-full gap-[1.2rem]">
          {upcomingTrips.length > 0 ? (
            upcomingTrips.map((trip) => (
              <CardTrip
                isUpcoming={true}
                key={trip.id}
                tripId={trip.id}
                startAt={trip.startAt}
                endAt={trip.endAt}
                title={trip.title}
                users={trip.members.map((member) => {
                  return {
                    id: member.userId,
                    name: member.name,
                    avatarUrl: member.avatarUrl,
                  };
                })}
              />
            ))
          ) : (
            <p className="text-[1.2rem] text-gray-500 mb-[1.2rem]">
              No upcoming trips
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => {
              router.push("/trips/new");
            }}
            className="mt-[3.2rem] bg-white border border-black/50 text-black hover:bg-black/5 transition-all duration-300"
          >
            <FaPlus className="h-4 w-4 text-black/75" />
            New Trip
          </Button>
        </div>

        <p
          className={cn(
            "text-[1.2rem] font-family-figtree uppercase mb-[1.2rem] mt-[5.6rem]",
          )}
        >
          Past
        </p>

        <div className="flex flex-col gap-[1.2rem] items-center justify-center w-full">
          {pastTrips.length > 0 ? (
            pastTrips.map((trip) => (
              <CardTrip
                key={trip.id}
                isUpcoming={false}
                tripId={trip.id}
                startAt={trip.startAt}
                endAt={trip.endAt}
                title={trip.title}
                users={trip.members.map((member) => {
                  return {
                    id: member.userId,
                    name: member.name,
                    avatarUrl: member.avatarUrl,
                  };
                })}
              />
            ))
          ) : (
            <p className="text-[1.2rem] text-gray-500 mb-[1.2rem]">
              No past trips
            </p>
          )}
        </div>
      </div>

      {/* 名前入力モーダル */}
      {showNameModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNameModal(false);
            }
          }}
        >
          <div className="bg-white p-[2.4rem] rounded-lg max-w-md w-full mx-4">
            <h1 className="text-2xl font-bold mb-[2.4rem] text-center">
              Welcome to Trip Drop!
            </h1>
            <form onSubmit={handleNameSubmit}>
              <label htmlFor="username">How do you call yourself?</label>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  if (v.trim().length <= 20) {
                    setNameError(null);
                  } else {
                    setNameError("Please enter a name within 20 characters.");
                  }
                }}
                required
                className="mb-4"
              />
              {nameError && (
                <p className="text-red-500 text-sm mt-[-0.5rem] mb-[0.8rem]">
                  {nameError}
                </p>
              )}
              <div className="flex gap-2 mt-[2.4rem]">
                <Button
                  type="submit"
                  disabled={loading || !name.trim() || name.trim().length > 20}
                  className="flex-1"
                >
                  {loading ? "loading..." : "Save"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowNameModal(false)}
                  className="flex-1 border border-gray-light bg-white text-black"
                >
                  Skip
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="my-[5.6rem] text-center">
        <button
          type="button"
          onClick={handleLogout}
          className="text-[1.2rem] font-medium text-black/70 hover:text-black transition-colors disabled:opacity-50 cursor-pointer"
          disabled={logoutLoading}
        >
          {logoutLoading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </PageWrapper>
  );
}
