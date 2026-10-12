import { mockAttendeesByClass, mockClasses } from "./data";
import type { ITimetableRepository } from "./interface";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const timetableRepository: ITimetableRepository = {
  async getClasses() {
    await delay(700);
    return mockClasses;
  },

  async getAttendees(classId) {
    await delay(600);
    return mockAttendeesByClass[classId] ?? [];
  },
};
