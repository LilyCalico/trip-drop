export interface MemberType {
  id: string;
  userId: string;
  tripId: string;
  role: string;
  joinedAt: string | null;
  permissions: any | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface TripType {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  timeZone: string;
  numberOfMembers: number | null;
  createdBy: string | null;
  createdAt: string | null;
  members: MemberType[];
}
