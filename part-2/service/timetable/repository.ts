import { mockAttendeesByClass, mockClasses, mockRooms } from "./data";
import type { ClassSession } from "../common/schema";
import type { ITimetableRepository } from "./interface";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const sortFields: Record<string, keyof ClassSession> = {
  name: "name",
  instructor: "instructor",
  roomId: "roomId",
  date: "date",
  time: "startTime",
  duration: "durationMins",
  attendeeCount: "attendeeCount",
  capacity: "capacity",
};
const roomsById = new Map(mockRooms.map((room) => [room.id, room]));

export const timetableRepository: ITimetableRepository = {
  async getClasses({ page, pageSize, sort }) {
    await delay(700);
    const rows = [...mockClasses];
    const field = sort ? sortFields[sort.columnId] : undefined;
    console.log(sort)
    if (field && sort) {
      if(sort?.columnId === "roomId"){
        rows.sort((a,b) => {
          const roomA = roomsById.get(a.roomId)
          const roomB = roomsById.get(b.roomId)
          const result = (roomA?.floor ?? 0) - (roomB?.floor ?? 0) || (roomA?.name ?? "").localeCompare(roomB?.name ?? "")
          return sort.direction === "asc" ? result : -result;
        })
      }
      rows.sort((a, b) => {
        const result = String(a[field]).localeCompare(String(b[field]), undefined, { numeric: true, sensitivity: "base" });
        return sort.direction === "asc" ? result : -result;
      });
    }
    return {
      rows: rows.slice((page - 1) * pageSize, page * pageSize),
      totalCount: rows.length,
    };
  },

  async getAttendees(classId) {
    await delay(600);
    return mockAttendeesByClass[classId] ?? [];
  },
};
