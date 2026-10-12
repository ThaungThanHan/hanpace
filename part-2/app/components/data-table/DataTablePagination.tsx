"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  pageSize: number;
  sizeOptions: number[];
  totalRows: number;
  rangeStart: number;
  rangeEnd: number;
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function DataTablePagination({ pageSize, sizeOptions, totalRows, rangeStart, rangeEnd, currentPage, pageCount, onPageChange, onPageSizeChange }: PaginationProps) {
  const pageSizeMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOnOutsideTap = (event: PointerEvent) => {
      const menu = pageSizeMenuRef.current;
      if (menu && !menu.contains(event.target as Node)) menu.open = false;
    };
    document.addEventListener("pointerdown", closeOnOutsideTap);
    return () => document.removeEventListener("pointerdown", closeOnOutsideTap);
  }, []);

  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-b-md border-t border-[#e7eee9] bg-[#fbfdfb] px-4 py-2 text-xs text-[#416352] sm:px-5">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <details
          ref={pageSizeMenuRef}
          className="relative z-30"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label={`Rows per page: ${pageSize}`} className="flex h-8 min-w-14 cursor-pointer list-none items-center justify-between gap-2 rounded border border-[#cfded3] bg-white px-2 text-[#284638] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58] [&::-webkit-details-marker]:hidden">
            {pageSize}<ChevronDown aria-hidden="true" className="size-4" />
          </summary>
          <div className="absolute bottom-full left-0 mb-1 min-w-full rounded border border-[#cfded3] bg-white p-1 shadow-md">
            {sizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                aria-current={size === pageSize ? "true" : undefined}
                onClick={(event) => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  onPageSizeChange(size);
                }}
                className="block h-8 w-full cursor-pointer rounded px-2 text-left text-[#284638] hover:bg-[#edf5ef] aria-current:bg-[#e1efe5] focus-visible:outline-2 focus-visible:outline-[#2b8a58]"
              >
                {size}
              </button>
            ))}
          </div>
        </details>
      </div>
      <div className="flex items-center gap-3">
        <span aria-live="polite" className="whitespace-nowrap">{totalRows === 0 ? "0 of 0" : `${rangeStart}-${rangeEnd} of ${totalRows}`}</span>
        <nav aria-label="Table pages" className="flex items-center gap-1">
          <button type="button" title="Previous page" aria-label="Previous page" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="inline-flex size-8 items-center justify-center rounded border border-[#dce8df] text-[#416352] hover:bg-[#edf5ef] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58]">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" title="Next page" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => onPageChange(currentPage + 1)} className="inline-flex size-8 items-center justify-center rounded border border-[#dce8df] text-[#416352] hover:bg-[#edf5ef] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58]">
            <ChevronRight className="size-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}
