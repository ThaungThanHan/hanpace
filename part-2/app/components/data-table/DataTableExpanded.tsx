"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DataTableColumn } from "./types";
import {
  columnWidthStyle,
  getColumnWidths,
  getFlexibleColumnIndex,
  pinnedDivider,
  pinnedEdgeHidden,
  pinnedEdgeVisible,
  renderCell,
  responsiveColumnWidth,
  responsiveTableWidth,
  skeletonWidths,
  tableWidthStyle,
} from "./utils";

export function SkeletonLine({ widthClass }: { widthClass: string }) {
  return <span aria-hidden="true" className={`block h-3 ${widthClass} rounded-sm bg-[#e1ebe4] animate-pulse motion-reduce:animate-none`} />;
}

export function ExpandedColumnsTable<TChild>({ columns, rows }: { columns: DataTableColumn<TChild>[]; rows: readonly TChild[] | null }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const pinnedEdge = isScrolled ? pinnedEdgeVisible : pinnedEdgeHidden;
  const pinnedColumnId = columns.find((column) => column.pinned)?.id;
  const columnWidths = getColumnWidths(columns, pinnedColumnId, 160, 170);
  const flexibleColumnIndex = getFlexibleColumnIndex(columns, pinnedColumnId);

  return (
    <div className="overflow-x-auto" onScroll={(event) => {
      const nextScrolled = event.currentTarget.scrollLeft > 0;
      if (nextScrolled !== scrolledRef.current) {
        scrolledRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }
    }}>
      {rows === null && <span role="status" className="sr-only">Loading details...</span>}
      <table aria-busy={rows === null} className={`${flexibleColumnIndex >= 0 ? "w-full" : "w-max"} table-fixed border-collapse text-left text-[13px] leading-5 break-words ${responsiveTableWidth}`} style={tableWidthStyle(columnWidths, 480)}>
        <colgroup>{columns.map((column, index) => <col key={column.id} className={index === flexibleColumnIndex ? undefined : responsiveColumnWidth} style={index === flexibleColumnIndex ? undefined : columnWidthStyle(columnWidths[index])} />)}</colgroup>
        <thead className="text-[#416352]">
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col" className={`px-3 pb-2 font-semibold ${column.id === pinnedColumnId ? `sticky left-0 z-20 bg-[#f4f9f5] ${pinnedDivider} ${pinnedEdge}` : ""}`}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e3ede5]">
          {rows === null
            ? Array.from({ length: 3 }, (_, rowIndex) => (
                <tr key={rowIndex} aria-hidden="true">
                  {columns.map((column, columnIndex) => (
                    <td key={column.id} className={`px-3 py-2 ${column.id === pinnedColumnId ? `sticky left-0 z-10 bg-[#f4f9f5] ${pinnedDivider} ${pinnedEdge}` : ""}`}>
                      <div className="flex h-5 items-center">
                        <SkeletonLine widthClass={skeletonWidths[(rowIndex + columnIndex) % skeletonWidths.length]} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((child, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.id} className={`px-3 py-2 text-[#385b48] ${column.id === pinnedColumnId ? `sticky left-0 z-10 bg-[#f4f9f5] ${pinnedDivider} ${pinnedEdge}` : ""}`}>{renderCell(column, child)}</td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExpandedPanel({ id, expanded, viewportWidth, children }: { id: string; expanded: boolean; viewportWidth: number | null; children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateHeight = () => setHeight(content.scrollHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      inert={!expanded}
      style={{ height: expanded ? height : 0, width: viewportWidth ?? "100%" }}
      className={`sticky left-0 overflow-hidden transition-[height,opacity] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${expanded ? "opacity-100" : "opacity-0"}`}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
