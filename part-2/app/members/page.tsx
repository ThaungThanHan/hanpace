"use client";

import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import type { MemberClassHistory } from "../../service/common/schema";
import type { MemberWithClassHistory } from "../../service/members/interface";
import { membersRepository } from "../../service/members/repository";

const columns: DataTableColumn<MemberWithClassHistory>[] = [
  { id: "name", header: "Name", accessor: "name", width: 190, tabletWidth: 160, mobileWidth: 140, pinned: true },
  { id: "id", header: "Member ID", accessor: "id" },
  { id: "email", header: "Email", accessor: "email" },
  { id: "birthday", header: "Birthday", accessor: "birthday" },
  { id: "membershipPlan", header: "Plan", accessor: "membershipPlan", sortable: false },
  { id: "planExpiryDate", header: "Plan Expiry", accessor: "planExpiryDate" },
  { id: "joinedAt", header: "Joined", accessor: "joinedAt" },
];

const expandedColumns: DataTableColumn<MemberClassHistory>[] = [
  { id: "className", header: "Class Name", accessor: "className", width: 190, tabletWidth: 160, mobileWidth: 140, pinned: true },
  { id: "date", header: "Date", accessor: "date" },
  { id: "bookingStatus", header: "Booking Status", accessor: "bookingStatus" },
  { id: "paymentType", header: "Payment Type", accessor: "paymentType" },
  { id: "checkedInAt", header: "Checked In At", accessor: "checkedInAt", format: "dateTime" },
];

export default function MembersPage() {
  const [members, setMembers] = useState<MemberWithClassHistory[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    membersRepository.getMembers().then(
      (result) => { if (active) setMembers(result); },
      () => { if (active) setLoadError(true); },
    );
    return () => { active = false; };
  }, [loadAttempt]);

  function retryLoading() {
    setMembers(null);
    setLoadError(false);
    setLoadAttempt((attempt) => attempt + 1);
  }

  return (
    <section>
      <h1 className="m-0 text-[26px] leading-[1.15] font-bold text-[#184b3d] md:text-[30px]">Members</h1>
      <DataTable<MemberWithClassHistory, MemberClassHistory>
        columns={columns}
        rows={members ?? []}
        loading={members === null}
        error={loadError ? "Could not load members." : null}
        onRetry={retryLoading}
        initialPageSize={2}
        pageSizeOptions={[2, 5, 10]}
        getRowId={(member) => member.id}
        expandedColumns={expandedColumns}
        expandedLabel="Class History"
        expansion="inline"
        getChildren={(member) => member.classHistory}
      />
    </section>
  );
}
