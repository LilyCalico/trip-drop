import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Button from "@/components/custom/Button";
import Input from "@/components/custom/Input";
import PageWrapper from "@/components/custom/PageWrapper";
import Spinner from "@/components/custom/Spinner";
import TripCard, { DUMMY_USERS } from "@/components/custom/trip/TripCard";
import { useCheckProfile } from "@/hooks/useCheckProfile";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);
  const { checkProfile } = useCheckProfile();
  const { updateProfile, error: updateProfileError } = useUpdateProfile();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

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

  // 認証が確定するまで、または未認証の場合は中身を描画しない
  if (authLoading || !isAuthenticated) {
    return <Spinner />;
  }

  return (
    <PageWrapper>
      <div>
        <h1 className="text-pagetitle mb-[3.2rem]">Your Trips</h1>

        <div className="bg-lightPink flex flex-col items-center justify-center w-full">
          <TripCard
            tripId="sampleid"
            startAt="2025-05-01"
            endAt="2025-05-20"
            title="Stockholm / London"
            users={DUMMY_USERS}
          />
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => {
              router.push("/trips/new");
            }}
            className="mt-[3.2rem] w-full max-w-[34.5rem]"
          >
            New Trip
          </Button>
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
    </PageWrapper>
  );
}
