"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "../components/data-table/DataTable";
import type { DataTableColumn, DataTableSort } from "../components/data-table/types";
import { formatDateTime } from "../lib/formatDateTime";
import { timetableRepository } from "../../service/timetable/repository";
import type { ClassPageResult } from "../../service/timetable/interface";
import type { Attendee, ClassSession } from "../../service/common/schema";
import { mockRooms } from "@/service/timetable/data";
const columns: DataTableColumn<ClassSession>[] = [
  { id: "name", header: "Class", accessor: "name", width: 190, tabletWidth: 160, mobileWidth: 140, sortable: true },
  { id: "instructor", header: "Instructor", accessor: "instructor", sortable: true, pinned: true, },
  { id: "roomId", header: "Room", accessor: "roomId", render: (row) => mockRooms[row.roomId - 1]?.name , sortable: true},
  { id: "date", header: "Date", accessor: "date", sortable: true },
  { id: "time", header: "Time", accessor: "startTime", render: (row) => `${row.startTime} - ${row.endTime}`, sortable: true },
  { id: "duration", header: "Duration", accessor: "durationMins", render: (row) => `${row.durationMins} min`, sortable: true },
  { id: "attendeeCount", header: "Attendees", accessor: "attendeeCount", sortable: true },
  { id: "capacity", header: "Capacity", accessor: "capacity", sortable: true },
  { id: "capacityStatus", header: "Capacity Status", accessor: "capacityStatus" },
  { id: "status", header: "Status", accessor: "status" },
];

const expandedColumns: DataTableColumn<Attendee>[] = [
  { id: "name", header: "Name", accessor: (row) => row.identity.name, width: 190, tabletWidth: 160, mobileWidth: 140, pinned: true },
  { id: "bookingStatus", header: "Booking Status", accessor: "bookingStatus" },
  {
    id: "identity",
    header: "Member ID",
    accessor: (row) => row.identity.type === "member" ? `${row.identity.memberId}` : "Guest"
  },
  { id: "paymentType", header: "Payment Type", accessor: "paymentType" },
  { id: "paymentStatus", header: "Payment Status", accessor: "paymentStatus" },
  { id: "bookingSource", header: "Booking Source", accessor: "bookingSource" },
  { id: "bookedAt", header: "Booked At", accessor: "bookedAt", render: (row) => formatDateTime(row.bookedAt) },
  { id: "checkedInAt", header: "Checked In At", accessor: "checkedInAt", render: (row) => formatDateTime(row.checkedInAt), width: 200 },
];

function positiveInteger(value: string | null, fallback: number) {
  if (!value || !/^[1-9]\d*$/.test(value)) return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : fallback;
}

function updateSearchParams(change: (params: URLSearchParams) => void) {
  const params = new URLSearchParams(window.location.search);
  change(params);
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) window.history.pushState(null, "", nextUrl);
}

function TimetableTable() {
  const searchParams = useSearchParams();
  const page = positiveInteger(searchParams.get("page"), 1);
  const pageSize = positiveInteger(searchParams.get("limit"), 2);
  const sortId = searchParams.get("sort");
  const sortDirection = searchParams.get("dir");
  const sort = useMemo<DataTableSort>(() => {
    if (!sortId || (sortDirection !== "asc" && sortDirection !== "desc") || !columns.some((column) => column.id === sortId && column.sortable === true)) return null;
    return { columnId: sortId, direction: sortDirection };
  }, [sortId, sortDirection]);
  const [requestState, setRequestState] = useState<{ key: string; result?: ClassPageResult; error?: boolean } | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const requestKey = `${page}:${pageSize}:${sort?.columnId ?? ""}:${sort?.direction ?? ""}:${loadAttempt}`;
  const currentState = requestState?.key === requestKey ? requestState : null;

  useEffect(() => {
    let active = true;
    timetableRepository.getClasses({ page, pageSize, sort }).then(
      (result) => {
        if (!active) return;
        const lastPage = Math.max(1, Math.ceil(result.totalCount / pageSize));
        if (page > lastPage) {
          updateSearchParams((params) => params.set("page", String(lastPage)));
          return;
        }
        setRequestState({ key: requestKey, result });
      },
      () => { if (active) setRequestState({ key: requestKey, error: true }); },
    );
    return () => { active = false; };
  }, [page, pageSize, sort, requestKey]);

  return (
    <DataTable<ClassSession, Attendee>
      columns={columns}
      expandedColumns={expandedColumns}
      expandedLabel="Attendees"
      rows={currentState?.result?.rows ?? []}
      loading={currentState === null}
      error={currentState?.error ? "Could not load classes." : null}
      onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
      initialPageSize={2}
      pageSizeOptions={[2, 5, 10]}
      sort={sort}
      onSortChange={(nextSort) => updateSearchParams((params) => {
        if (nextSort) {
          params.set("sort", nextSort.columnId);
          params.set("dir", nextSort.direction);
        } else {
          params.delete("sort");
          params.delete("dir");
        }
        params.set("page", "1");
      })}
      manualSorting
      page={page}
      pageSize={pageSize}
      totalCount={currentState?.result?.totalCount ?? 0}
      onPageChange={(nextPage) => updateSearchParams((params) => params.set("page", String(nextPage)))}
      onPageSizeChange={(nextPageSize) => updateSearchParams((params) => {
        params.set("limit", String(nextPageSize));
        params.set("page", "1");
      })}
      manualPagination
      getRowId={(row) => row.id}
      expansion="onDemand"
      loadChildren={(row) => timetableRepository.getAttendees(row.id)}
    />
  );
}

export default function TimetablePage() {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-[26px] leading-[1.15] font-bold text-[#184b3d] md:text-[30px]">TimeTable</h1>
      </div>
      <Suspense fallback={<DataTable<ClassSession, Attendee> columns={columns} rows={[]} loading initialPageSize={2} />}>
        <TimetableTable />
      </Suspense>
    </section>
  );
}
