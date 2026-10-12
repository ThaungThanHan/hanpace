import type { Attendee, ClassSession } from "../common/schema";

export interface ClassPageQuery {
  page: number;
  pageSize: number;
  sort: { columnId: string; direction: "asc" | "desc" } | null;
}

export interface ClassPageResult {
  rows: ClassSession[];
  totalCount: number;
}

export interface ITimetableRepository {
  getClasses(query: ClassPageQuery): Promise<ClassPageResult>;
  getAttendees(classId: number): Promise<Attendee[]>;
}
