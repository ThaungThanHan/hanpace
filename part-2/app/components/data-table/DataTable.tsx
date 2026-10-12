"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronRight, ChevronsDown, ChevronsUp, ChevronsUpDown, RotateCcw } from "lucide-react";
import { DataTablePagination } from "./DataTablePagination";
import { ExpandedColumnsTable, ExpandedPanel, SkeletonLine } from "./DataTableExpanded";
import type { ChildState, DataTableProps, DataTableSort, RowId } from "./types";
import {
  columnWidthStyle,
  defaultPageSizeOptions,
  getColumnWidths,
  getFlexibleColumnIndex,
  pinnedDivider,
  pinnedEdgeHidden,
  pinnedEdgeVisible,
  renderCell,
  responsiveColumnWidth,
  responsiveTableWidth,
  skeletonWidths,
  sortCollator,
  tableWidthStyle,
} from "./utils";

export function DataTable<TRow, TChild = never>(props: DataTableProps<TRow, TChild>) {
  const {
    columns,
    rows,
    loading = false,
    error,
    onRetry,
    initialPageSize = 10,
    pageSizeOptions = defaultPageSizeOptions,
    getRowId,
    expansion,
    sort: controlledSort,
    onSortChange,
    manualSorting = false,
  } = props;
  const [localSort, setLocalSort] = useState<DataTableSort>(null);
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setPageSize] = useState(() => Number.isInteger(initialPageSize) && initialPageSize > 0 ? initialPageSize : 10);
  const [expandedIds, setExpandedIds] = useState<Set<RowId>>(() => new Set());
  const [openedIds, setOpenedIds] = useState<Set<RowId>>(() => new Set());
  const [childStates, setChildStates] = useState<Map<RowId, ChildState<TChild>>>(() => new Map());
  const [isScrolled, setIsScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableId = useId();
  const requestedSort = controlledSort === undefined ? localSort : controlledSort;
  const sort = requestedSort && columns.some((column) => column.id === requestedSort.columnId && column.sortable === true) ? requestedSort : null;
  const isLoading = loading && !error;
  const pageSize = props.pageSize !== undefined && Number.isInteger(props.pageSize) && props.pageSize > 0 ? props.pageSize : localPageSize;
  const pinnedEdge = isScrolled ? pinnedEdgeVisible : pinnedEdgeHidden;
  const pinnedColumnId = columns.find((column) => column.pinned)?.id;
  const columnWidths = getColumnWidths(columns, pinnedColumnId, 190, 150);
  const flexibleColumnIndex = getFlexibleColumnIndex(columns, pinnedColumnId);
  const sizeOptions = [...new Set([initialPageSize, pageSize, ...pageSizeOptions].filter((size) => Number.isInteger(size) && size > 0))].sort((a, b) => a - b);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateWidth = () => setViewportWidth(container.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const sortedRows = useMemo(() => {
    const indexedRows = rows.map((row, index) => ({ row, index }));
    if (manualSorting) return indexedRows;
    const column = columns.find((item) => item.id === sort?.columnId && item.sortable === true);
    if (!column || !sort) return indexedRows;

    const keyedRows = indexedRows.map(({ row, index }) => ({
      row,
      index,
      sortValue: String((typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor]) ?? ""),
    }));
    return keyedRows.sort((a, b) => {
      const result = sortCollator.compare(a.sortValue, b.sortValue);
      return (sort.direction === "asc" ? result : -result) || a.index - b.index;
    });
  }, [columns, rows, sort, manualSorting]);
  const totalRows = props.manualPagination ? props.totalCount : sortedRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const requestedPage = props.page ?? localPage;
  const currentPage = Number.isInteger(requestedPage) ? Math.max(1, Math.min(requestedPage, pageCount)) : 1;
  const pagedRows = props.manualPagination ? sortedRows : sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = pagedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = pagedRows.length === 0 ? 0 : Math.min((currentPage - 1) * pageSize + pagedRows.length, totalRows);

  function changePage(nextPage: number) {
    if (props.page === undefined) setLocalPage(nextPage);
    props.onPageChange?.(nextPage);
  }

  function resetPage() {
    changePage(1);
  }

  function changePageSize(nextPageSize: number) {
    if (props.pageSize === undefined) setPageSize(nextPageSize);
    props.onPageSizeChange?.(nextPageSize);
    resetPage();
  }

  function changeSort(columnId: string) {
    if (!columns.some((column) => column.id === columnId && column.sortable === true)) return;
    const nextSort: DataTableSort = sort?.columnId !== columnId
      ? { columnId, direction: "asc" }
      : sort.direction === "asc"
        ? { columnId, direction: "desc" }
        : null;
    if (controlledSort === undefined) setLocalSort(nextSort);
    onSortChange?.(nextSort);
    resetPage();
  }

  async function loadRow(row: TRow, id: RowId) {
    if (props.expansion !== "onDemand") return;
    setChildStates((current) => new Map(current).set(id, { status: "loading" }));
    try {
      const children = await props.loadChildren(row);
      setChildStates((current) => new Map(current).set(id, { status: "ready", children }));
    } catch {
      setChildStates((current) => new Map(current).set(id, { status: "error" }));
    }
  }

  function toggleRow(row: TRow, id: RowId) {
    if (!expansion) return;
    const opening = !expandedIds.has(id);
    setExpandedIds((current) => {
      const next = new Set(current);
      if (opening) next.add(id);
      else next.delete(id);
      return next;
    });
    if (opening) {
      setOpenedIds((current) => new Set(current).add(id));
      if (props.expansion === "onDemand" && !childStates.has(id)) void loadRow(row, id);
    }
  }

  function expandedContent(row: TRow, id: RowId) {
    if (!expansion) return null;
    if (props.expansion === "inline") {
      const children = props.getChildren(row);
      return renderChildren(row, children);
    }

    const state = childStates.get(id);
    if (!state || state.status === "loading") {
      if (props.expandedColumns?.length) return <ExpandedColumnsTable columns={props.expandedColumns} rows={null} />;
      return (
        <div role="status" aria-label="Loading details" className="space-y-3">
          {skeletonWidths.map((widthClass) => <div key={widthClass} className="flex h-5 items-center"><SkeletonLine widthClass={widthClass} /></div>)}
        </div>
      );
    }
    if (state.status === "error") {
      return (
        <div role="alert" className="flex items-center gap-3 text-[#8b443b]">
          Could not load details.
          <button type="button" onClick={() => void loadRow(row, id)} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-[#642e28]">
            <RotateCcw className="size-4" /> Retry
          </button>
        </div>
      );
    }
    return renderChildren(row, state.children);
  }

  function renderChildren(row: TRow, children: readonly TChild[]) {
    if (!children.length) return <p>No details for this row.</p>;
    const expandedColumns = props.expandedColumns;
    if (expandedColumns?.length) {
      return <ExpandedColumnsTable columns={expandedColumns} rows={children} />;
    }
    return props.renderExpanded?.(row, children) ?? null;
  }

  return (
    <div className="mt-6 w-full rounded-md border border-[#dce8df] bg-white">
      <div ref={scrollRef} className="w-full overflow-x-auto rounded-t-md" onScroll={(event) => {
        const nextScrolled = event.currentTarget.scrollLeft > 0;
        if (nextScrolled !== scrolledRef.current) {
          scrolledRef.current = nextScrolled;
          setIsScrolled(nextScrolled);
        }
      }}>
      {isLoading && <span role="status" className="sr-only">Loading rows...</span>}
      <table aria-busy={Boolean(isLoading)} className={`${flexibleColumnIndex >= 0 ? "w-full" : "w-max"} table-fixed border-collapse text-left text-sm break-words ${responsiveTableWidth}`} style={tableWidthStyle(columnWidths, 680)}>
        <colgroup>{columns.map((column, index) => <col key={column.id} className={index === flexibleColumnIndex ? undefined : responsiveColumnWidth} style={index === flexibleColumnIndex ? undefined : columnWidthStyle(columnWidths[index])} />)}</colgroup>
        <thead className="bg-[#f2f8f3] text-[#416352]">
          <tr>
            {columns.map((column) => {
              const sortable = column.sortable === true;
              const direction = sort?.columnId === column.id ? sort.direction : null;
              return (
                <th key={column.id} scope="col" aria-sort={sortable ? (direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none") : undefined} className={`py-4 font-semibold ${column.id === pinnedColumnId ? `sticky left-0 z-20 bg-[#f2f8f3] px-3 md:px-5 ${pinnedDivider} ${pinnedEdge}` : "px-5"}`}>
                  {sortable ? (
                    <button type="button" disabled={loading || Boolean(error)} onClick={() => changeSort(column.id)} className={`inline-flex cursor-pointer items-center gap-2 transition-colors duration-150 motion-reduce:transition-none hover:text-[#174b38] disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58] ${direction ? "text-[#174b38]" : ""}`}>
                      {column.header}
                      <span aria-hidden="true" className="relative block size-4 shrink-0">
                        <ChevronsUpDown className={`absolute inset-0 size-4 text-[#779584] transition-[opacity,transform] duration-150 motion-reduce:transition-none ${direction === null ? "scale-100 opacity-100" : "scale-75 opacity-0"}`} />
                        <ChevronsUp className={`absolute inset-0 size-4 transition-[opacity,transform] duration-150 motion-reduce:transition-none ${direction === "asc" ? "scale-100 opacity-100" : "scale-75 opacity-0"}`} />
                        <ChevronsDown className={`absolute inset-0 size-4 transition-[opacity,transform] duration-150 motion-reduce:transition-none ${direction === "desc" ? "scale-100 opacity-100" : "scale-75 opacity-0"}`} />
                      </span>
                    </button>
                  ) : column.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isLoading && Array.from({ length: Math.min(pageSize, 4) }, (_, rowIndex) => (
            <tr key={rowIndex} aria-hidden="true" className="border-t border-[#e7eee9]">
              {columns.map((column, columnIndex) => (
                <td key={column.id} className={`py-4 ${column.id === pinnedColumnId ? `sticky left-0 z-10 bg-white px-3 md:px-5 ${pinnedDivider} ${pinnedEdge}` : "px-5"}`}>
                  <div className="flex h-5 items-center gap-2">
                    {expansion && columnIndex === 0 && <span className="size-4 shrink-0 rounded-sm bg-[#e1ebe4] animate-pulse motion-reduce:animate-none" />}
                    <SkeletonLine widthClass={skeletonWidths[(rowIndex + columnIndex) % skeletonWidths.length]} />
                  </div>
                </td>
              ))}
            </tr>
          ))}
          {!loading && !error && pagedRows.map(({ row, index }) => {
            const id = props.expansion ? props.getRowId(row) : getRowId?.(row) ?? index;
            const expanded = expandedIds.has(id);
            const panelId = `${tableId}-expanded-${index}`;
            const firstColumn = columns[0];
            const firstValue = firstColumn && (typeof firstColumn.accessor === "function" ? firstColumn.accessor(row) : row[firstColumn.accessor]);
            const rowLabel = typeof firstValue === "string" || typeof firstValue === "number" ? String(firstValue) : `row ${index + 1}`;
            return (
              <Fragment key={id}>
                <tr
                  onClick={expansion ? (event) => {
                    if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea")) return;
                    toggleRow(row, id);
                  } : undefined}
                  className={`group/row border-t border-[#e7eee9] ${expansion ? "cursor-pointer" : ""}`}
                >
                  {columns.map((column, columnIndex) => {
                    return (
                      <td key={column.id} className={`py-4 text-[#284638] transition-colors duration-150 group-hover/row:bg-[#f8fbf8] ${column.id === pinnedColumnId ? `sticky left-0 z-10 bg-white px-3 md:px-5 ${pinnedDivider} ${pinnedEdge}` : "px-5"}`}>
                        <span className="inline-flex items-center gap-2">
                          {expansion && columnIndex === 0 && (
                            <button
                              type="button"
                              aria-expanded={expanded}
                              aria-controls={panelId}
                              aria-label={`${expanded ? "Collapse" : "Expand"} ${rowLabel} details`}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleRow(row, id);
                              }}
                              className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-[#488967] hover:bg-[#edf5ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58]"
                            >
                              <ChevronRight aria-hidden="true" className={`size-4 transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`} />
                            </button>
                          )}
                          {renderCell(column, row)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {expansion && (
                  <tr aria-hidden={!expanded}>
                    <td colSpan={columns.length} className="p-0">
                      <ExpandedPanel id={panelId} expanded={expanded} viewportWidth={viewportWidth}>
                        {openedIds.has(id) && (
                          <div className="border-t border-[#e5eee7] bg-[#f4f9f5] py-5 pl-12 pr-6 text-[#385b48]">
                            {props.expandedLabel && <p className="mb-3 text-xs font-semibold text-[#416352]">{props.expandedLabel}</p>}
                            {expandedContent(row, id)}
                          </div>
                        )}
                      </ExpandedPanel>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {error && (
            <tr>
              <td colSpan={columns.length} className="border-t border-[#e7eee9] p-0">
                <div style={{ width: viewportWidth ?? "100%" }} className="sticky left-0 flex min-h-32 flex-col items-start justify-center gap-3 px-5 py-6 text-[#8b443b]">
                  <p role="alert">{error}</p>
                  {onRetry && (
                    <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 font-semibold underline underline-offset-2 hover:text-[#642e28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b443b]">
                      <RotateCcw className="size-4" /> Retry
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
          {!loading && !error && rows.length === 0 && <tr><td colSpan={columns.length} className="px-5 py-8 text-center text-[#587065]">No rows to display.</td></tr>}
        </tbody>
      </table>
      </div>
      {!loading && !error && (
        <DataTablePagination
          pageSize={pageSize}
          sizeOptions={sizeOptions}
          totalRows={totalRows}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
        />
      )}
    </div>
  );
}
