import { mockAttendeesByClass, mockClasses } from "./data";
import type { ClassSession } from "../common/schema";
import type { ITimetableRepository } from "./interface";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const sortFields: Record<string, keyof ClassSession> = {
  name: "name",
  instructor: "instructor",
  date: "date",
  time: "startTime",
  duration: "durationMins",
  attendeeCount: "attendeeCount",
  capacity: "capacity",
};

export const timetableRepository: ITimetableRepository = {
  async getClasses({ page, pageSize, sort }) {
    await delay(700);
    const rows = [...mockClasses];
    const field = sort ? sortFields[sort.columnId] : undefined;
    if (field && sort) {
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
