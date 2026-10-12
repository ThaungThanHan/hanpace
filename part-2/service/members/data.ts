import type { Member, MemberClassHistory } from "../common/schema";
import { mockAttendeesByClass, mockClasses } from "../timetable/data";

export const mockMembers: Member[] = [
  { id: "ABC1234", name: "Grace Lee", email: "grace@example.com", birthday: "1992-05-14", joinedAt: "2025-03-10", membershipPlan: "Platinum", planExpiryDate: "2027-03-10" },
  { id: "QRM5824", name: "Daniel Wong", email: "daniel@example.com", birthday: "1988-11-23", joinedAt: "2025-06-18", membershipPlan: "Standard", planExpiryDate: "2026-10-31" },
  { id: "KDL1947", name: "Ethan Tan", email: "ethan@example.com", birthday: "1995-02-08", joinedAt: "2025-04-22", membershipPlan: "Gold", planExpiryDate: "2027-04-22" },
  { id: "TNV6382", name: "Mia Chen", email: "mia@example.com", birthday: "1999-08-17", joinedAt: "2026-01-15", membershipPlan: "Standard", planExpiryDate: "2026-11-15" },
  { id: "BXA4075", name: "Nora Patel", email: "nora@example.com", birthday: "1990-12-03", joinedAt: "2025-08-07", membershipPlan: "Platinum", planExpiryDate: "2027-08-07" },
];

export const mockMemberClassHistoriesByMember: Record<string, MemberClassHistory[]> = Object.fromEntries(
  mockMembers.map((member) => [
    member.id,
    mockClasses
      .flatMap((classSession) =>
        (mockAttendeesByClass[classSession.id] ?? [])
          .filter((attendee) => attendee.identity.type === "member" && attendee.identity.memberId === member.id)
          .map((attendee) => ({
            id: attendee.id,
            className: classSession.name,
            date: classSession.date,
            bookingStatus: attendee.bookingStatus,
            paymentType: attendee.paymentType,
            checkedInAt: attendee.checkedInAt,
          })),
      )
      .sort((a, b) => b.date.localeCompare(a.date)),
  ]),
);
