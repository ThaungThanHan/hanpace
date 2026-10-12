import type { Attendee, ClassSession } from "../common/schema";

export interface ITimetableRepository {
  getClasses(): Promise<ClassSession[]>;
  getAttendees(classId: number): Promise<Attendee[]>;
}
