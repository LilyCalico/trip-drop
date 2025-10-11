export interface MemberType {
  id: string;
  userId: string | null;
  tripId: string | null;
  role: string | null;
  joinedAt: string | null;
  permissions: any | null;
  name: string | null;
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
