"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { timetableRepository } from "../../service/timetable/repository";
import type { Attendee, ClassSession } from "../../service/common/schema";

const columns: DataTableColumn<ClassSession>[] = [
  { id: "name", header: "Class", accessor: "name", width: 220 },
  { id: "instructor", header: "Instructor", accessor: "instructor" },
  { id: "date", header: "Date", accessor: "date" },
  { id: "time", header: "Time", accessor: "startTime", render: (row) => `${row.startTime} - ${row.endTime}` },
  { id: "duration", header: "Duration", accessor: "durationMins", render: (row) => `${row.durationMins} min` },
  { id: "attendeeCount", header: "Attendees", accessor: "attendeeCount" },
  { id: "capacity", header: "Capacity", accessor: "capacity" },
  { id: "capacityStatus", header: "Capacity Status", accessor: "capacityStatus", sortable: false },
  { id: "status", header: "Status", accessor: "status", sortable: false},
];

const expandedColumns: DataTableColumn<Attendee>[] = [
  { id: "name", header: "Name", accessor: (row) => row.identity.name, width: 200 },
  { id: "bookingStatus", header: "Booking Status", accessor: "bookingStatus" },
  {
    id: "identity",
    header: "Member ID",
    accessor: (row) => row.identity.type === "member" ? `${row.identity.memberId}` : "Guest",
  },
  { id: "paymentType", header: "Payment Type", accessor: "paymentType" },
  { id: "paymentStatus", header: "Payment Status", accessor: "paymentStatus" },
  { id: "bookingSource", header: "Booking Source", accessor: "bookingSource" },
  { id: "bookedAt", header: "Booked At", accessor: "bookedAt", format: "dateTime" },
  { id: "checkedInAt", header: "Checked In At", accessor: "checkedInAt", format: "dateTime", width: 200 },
];

function positiveInteger(value: string | null, fallback: number) {
  if (!value || !/^[1-9]\d*$/.test(value)) return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : fallback;
}

function TimetableTable({ rows, error, onRetry }: { rows: ClassSession[] | null; error: boolean; onRetry: () => void }) {
  const searchParams = useSearchParams();
  const page = positiveInteger(searchParams.get("page"), 1);
  const pageSize = positiveInteger(searchParams.get("limit"), 2);

  function updatePagination(next: { page: number; pageSize: number }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next.page));
    params.set("limit", String(next.pageSize));
    window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
  }

  return (
    <DataTable<ClassSession, Attendee>
      columns={columns}
      expandedColumns={expandedColumns}
      expandedLabel="Attendees"
      rows={rows ?? []}
      loading={rows === null}
      error={error ? "Could not load classes." : null}
      onRetry={onRetry}
      initialPageSize={2}
      pageSizeOptions={[2, 5, 10]}
      pagination={{ page, pageSize }}
      onPaginationChange={updatePagination}
      getRowId={(row) => row.id}
      expansion="onDemand"
      loadChildren={(row) => timetableRepository.getAttendees(row.id)}
    />
  );
}

export default function TimetablePage() {
  const [rows, setRows] = useState<ClassSession[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    timetableRepository.getClasses().then(
      (classes) => { if (active) setRows(classes); },
      () => { if (active) setLoadError(true); },
    );
    return () => { active = false; };
  }, [loadAttempt]);

  function retryLoading() {
    setRows(null);
    setLoadError(false);
    setLoadAttempt((attempt) => attempt + 1);
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-[26px] leading-[1.15] font-bold text-[#184b3d] md:text-[30px]">TimeTable</h1>
      </div>
      <Suspense fallback={<DataTable<ClassSession, Attendee> columns={columns} rows={[]} loading initialPageSize={2} />}>
        <TimetableTable rows={rows} error={loadError} onRetry={retryLoading} />
      </Suspense>
    </section>
  );
}
