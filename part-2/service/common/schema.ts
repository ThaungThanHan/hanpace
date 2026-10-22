export type ClassStatus =
  | "Scheduled"
  | "Completed"
  | "Cancelled";

export type CapacityStatus =
  | "Available"
  | "Full";

export type BookingStatus =
  | "Booked"
  | "Checked-in"
  | "Cancelled"
  | "No-show";

export type PaymentType =
  | "One-time"
  | "Membership";

export type PaymentStatus =
  | "Paid"
  | "Pending"

export type BookingSource =
  | "Web"
  | "Mobile App"
  | "Front Desk";

export type MembershipPlan =
  | "Standard"
  | "Gold"
  | "Platinum";

export interface Member {
  id: string;
  name: string;
  email: string;
  birthday: string;
  phone?: string;
  emergencyContact?: string;
  joinedAt: string;
  membershipPlan: MembershipPlan;
  planExpiryDate: string;
}

export interface MemberClassHistory {
  id: number;
  className: string;
  date: string;
  bookingStatus: BookingStatus;
  paymentType: PaymentType;
  checkedInAt: string | null;
}

export type AttendeeIdentity =
  | {
      type: "member";
      memberId: string;
      name: string;
    }
  | {
      type: "guest";
      name: string;
      email?: string;
      phone?: string;
    };

export interface Attendee {
  id: number; // booking / attendance record ID

  identity: AttendeeIdentity;

  paymentType: PaymentType;
  paymentStatus: PaymentStatus;

  bookingStatus: BookingStatus;
  bookingSource: BookingSource;

  bookedAt: string;
  checkedInAt: string | null;
}

export interface ClassSession {
  id: number;

  name: string;
  instructor: string;
  roomId: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMins: number;

  capacity: number;
  attendeeCount: number;

  status: ClassStatus;
  capacityStatus: CapacityStatus;
}

export interface Rooms {
  id: number;
  name: string;
  floor: number
}