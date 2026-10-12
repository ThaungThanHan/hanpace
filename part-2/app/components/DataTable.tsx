"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsDown, ChevronsUp, ChevronsUpDown, RotateCcw } from "lucide-react";

export interface DataTableColumn<TRow> {
  id: string;
  header: ReactNode;
  accessor: keyof TRow | ((row: TRow) => unknown);
  render?: (row: TRow) => ReactNode;
  format?: "dateTime";
  sortable?: boolean;
  /** Width in pixels. */
  width?: number;
}

type RowId = string | number;
type Sort = { columnId: string; direction: "asc" | "desc" } | null;
type Pagination = { page: number; pageSize: number };

export type DataTableExpansionMode = "inline" | "onDemand";

interface DataTableBaseProps<TRow, TChild> {
  columns: DataTableColumn<TRow>[];
  expandedColumns?: DataTableColumn<TChild>[];
  expandedLabel?: ReactNode;
  rows: TRow[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  initialPageSize?: number;
  pageSizeOptions?: readonly number[];
  getRowId?: (row: TRow) => RowId;
  sort?: Sort;
  onSortChange?: (sort: Sort) => void;
  renderExpanded?: (row: TRow, children: readonly TChild[]) => ReactNode;
}

export type DataTableProps<TRow, TChild> = DataTableBaseProps<TRow, TChild> & (
  | { pagination?: undefined; onPaginationChange?: never }
  | { pagination: Pagination; onPaginationChange: (pagination: Pagination) => void }
) & (
  | { expansion?: undefined; getChildren?: never; loadChildren?: never }
  | { expansion: "inline"; getChildren: (row: TRow) => readonly TChild[]; loadChildren?: never }
  | { expansion: "onDemand"; getChildren?: never; loadChildren: (row: TRow) => Promise<readonly TChild[]> }
);

type ChildState<TChild> =
  | { status: "loading" }
  | { status: "ready"; children: readonly TChild[] }
  | { status: "error" };

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function renderCell<TRow>(column: DataTableColumn<TRow>, row: TRow): ReactNode {
  if (column.render) return column.render(row);
  const value = typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor];
  if (column.format === "dateTime") {
    if (value == null || value === "") return "-";
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : dateTimeFormatter.format(date);
  }
  return value == null ? "" : String(value);
}

const skeletonWidths = ["w-3/4", "w-2/3", "w-1/2"];
const defaultPageSizeOptions = [10, 25, 50];
const pinnedDivider = "after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-[#c5d7ca] after:content-[''] after:transition-opacity after:duration-150";
const pinnedEdgeVisible = "after:opacity-100 shadow-[3px_0_8px_-5px_rgba(31,78,53,0.18)]";
const pinnedEdgeHidden = "after:opacity-0";

function SkeletonLine({ widthClass }: { widthClass: string }) {
  return <span aria-hidden="true" className={`block h-3 ${widthClass} rounded-sm bg-[#e1ebe4] animate-pulse motion-reduce:animate-none`} />;
}

function ExpandedColumnsTable<TChild>({ columns, rows }: { columns: DataTableColumn<TChild>[]; rows: readonly TChild[] | null }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pinnedEdge = isScrolled ? pinnedEdgeVisible : pinnedEdgeHidden;
  const columnWidths = columns.map((column, index) => column.width ?? (index === 0 ? 160 : 170));

  return (
    <div className="overflow-x-auto" onScroll={(event) => setIsScrolled(event.currentTarget.scrollLeft > 0)}>
      {rows === null && <span role="status" className="sr-only">Loading details...</span>}
      <table aria-busy={rows === null} className="w-full table-fixed border-collapse text-left text-[13px] leading-5 break-words" style={{ minWidth: Math.max(480, columnWidths.reduce((sum, width) => sum + width, 0)) }}>
        <colgroup>{columns.map((column, index) => <col key={column.id} style={{ width: columnWidths[index] }} />)}</colgroup>
        <thead className="text-[#416352]">
          <tr>
            {columns.map((column, columnIndex) => (
              <th key={column.id} scope="col" className={`px-3 pb-2 font-semibold ${columnIndex === 0 ? `sticky left-0 z-20 bg-[#f4f9f5] ${pinnedDivider} ${pinnedEdge}` : ""}`}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e3ede5]">
          {rows === null
            ? Array.from({ length: 3 }, (_, rowIndex) => (
                <tr key={rowIndex} aria-hidden="true">
                  {columns.map((column, columnIndex) => (
                    <td key={column.id} className={`px-3 py-2 ${columnIndex === 0 ? `sticky left-0 z-10 bg-[#f4f9f5] ${pinnedDivider} ${pinnedEdge}` : ""}`}>
                      <div className="flex h-5 items-center">
                        <SkeletonLine widthClass={skeletonWidths[(rowIndex + columnIndex) % skeletonWidths.length]} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((child, index) => (
                <tr key={index}>
                  {columns.map((column, columnIndex) => (
                    <td key={column.id} className={`px-3 py-2 text-[#385b48] ${columnIndex === 0 ? `sticky left-0 z-10 bg-[#f4f9f5] ${pinnedDivider} ${pinnedEdge}` : ""}`}>{renderCell(column, child)}</td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpandedPanel({ id, expanded, viewportWidth, children }: { id: string; expanded: boolean; viewportWidth: number | null; children: ReactNode }) {
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
  } = props;
  const [localSort, setLocalSort] = useState<Sort>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [localPageSize, setPageSize] = useState(() => Number.isInteger(initialPageSize) && initialPageSize > 0 ? initialPageSize : 10);
  const [expandedIds, setExpandedIds] = useState<Set<RowId>>(() => new Set());
  const [openedIds, setOpenedIds] = useState<Set<RowId>>(() => new Set());
  const [childStates, setChildStates] = useState<Map<RowId, ChildState<TChild>>>(() => new Map());
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableId = useId();
  const sort = controlledSort === undefined ? localSort : controlledSort;
  const isLoading = loading && !error;
  const pageSize = props.pagination?.pageSize ?? localPageSize;
  const pinnedEdge = isScrolled ? pinnedEdgeVisible : pinnedEdgeHidden;
  const columnWidths = columns.map((column, index) => column.width ?? (index === 0 ? 190 : 150));
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
    const column = columns.find((item) => item.id === sort?.columnId && item.sortable !== false);
    if (!column || !sort) return indexedRows;

    return indexedRows.sort((a, b) => {
      const aValue = typeof column.accessor === "function" ? column.accessor(a.row) : a.row[column.accessor];
      const bValue = typeof column.accessor === "function" ? column.accessor(b.row) : b.row[column.accessor];
      const result = String(aValue ?? "").localeCompare(String(bValue ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return (sort.direction === "asc" ? result : -result) || a.index - b.index;
    });
  }, [columns, rows, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const requestedPageIndex = props.pagination ? props.pagination.page - 1 : pageIndex;
  const currentPage = Math.max(0, Math.min(requestedPageIndex, pageCount - 1));
  const pagedRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const rangeStart = sortedRows.length === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = Math.min((currentPage + 1) * pageSize, sortedRows.length);

  function changePagination(page: number, nextPageSize: number) {
    if (props.pagination) props.onPaginationChange({ page, pageSize: nextPageSize });
    else {
      setPageIndex(page - 1);
      setPageSize(nextPageSize);
    }
  }

  function changeSort(columnId: string) {
    if (!columns.some((column) => column.id === columnId && column.sortable !== false)) return;
    if (currentPage !== 0) changePagination(1, pageSize);
    const nextSort: Sort = sort?.columnId !== columnId
      ? { columnId, direction: "asc" }
      : sort.direction === "asc"
        ? { columnId, direction: "desc" }
        : null;
    if (onSortChange) onSortChange(nextSort);
    else setLocalSort(nextSort);
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
    <div className="mt-6 w-full overflow-hidden rounded-md border border-[#dce8df] bg-white">
      <div ref={scrollRef} className="w-full overflow-x-auto" onScroll={(event) => setIsScrolled(event.currentTarget.scrollLeft > 0)}>
      {isLoading && <span role="status" className="sr-only">Loading rows...</span>}
      <table aria-busy={Boolean(isLoading)} className="w-full table-fixed border-collapse text-left text-sm break-words" style={{ minWidth: Math.max(680, columnWidths.reduce((sum, width) => sum + width, 0)) }}>
        <colgroup>{columns.map((column, index) => <col key={column.id} style={{ width: columnWidths[index] }} />)}</colgroup>
        <thead className="bg-[#f2f8f3] text-[#416352]">
          <tr>
            {columns.map((column, columnIndex) => {
              const sortable = column.sortable !== false;
              return (
                <th key={column.id} scope="col" aria-sort={sortable ? (sort?.columnId === column.id ? (sort.direction === "asc" ? "ascending" : "descending") : "none") : undefined} className={`px-5 py-4 font-semibold ${columnIndex === 0 ? `sticky left-0 z-20 bg-[#f2f8f3] ${pinnedDivider} ${pinnedEdge}` : ""}`}>
                  {sortable ? (
                    <button type="button" disabled={loading || Boolean(error)} onClick={() => changeSort(column.id)} className="inline-flex items-center gap-2 hover:text-[#174b38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58]">
                      {column.header}
                      {sort?.columnId === column.id
                        ? sort.direction === "asc" ? <ChevronsUp className="size-4" /> : <ChevronsDown className="size-4" />
                        : <ChevronsUpDown className="size-4 text-[#779584]" />}
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
                <td key={column.id} className={`px-5 py-4 ${columnIndex === 0 ? `sticky left-0 z-10 bg-white ${pinnedDivider} ${pinnedEdge}` : ""}`}>
                  <div className="flex h-5 items-center gap-2">
                    {expansion && columnIndex === 0 && <span className="size-4 shrink-0 rounded-sm bg-[#e1ebe4] animate-pulse motion-reduce:animate-none" />}
                    <SkeletonLine widthClass={skeletonWidths[(rowIndex + columnIndex) % skeletonWidths.length]} />
                  </div>
                </td>
              ))}
            </tr>
          ))}
          {!loading && !error && pagedRows.map(({ row, index }) => {
            const id = getRowId ? getRowId(row) : index;
            const expanded = expandedIds.has(id);
            const panelId = `${tableId}-expanded-${index}`;
            return (
              <Fragment key={id}>
                <tr
                  onClick={expansion ? () => toggleRow(row, id) : undefined}
                  onKeyDown={expansion ? (event) => {
                    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      toggleRow(row, id);
                    }
                  } : undefined}
                  tabIndex={expansion ? 0 : undefined}
                  aria-expanded={expansion ? expanded : undefined}
                  aria-controls={expansion ? panelId : undefined}
                  className={`group/row border-t border-[#e7eee9] ${expansion ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2b8a58]" : ""}`}
                >
                  {columns.map((column, columnIndex) => {
                    return (
                      <td key={column.id} className={`px-5 py-4 text-[#284638] transition-colors duration-150 group-hover/row:bg-[#f8fbf8] ${columnIndex === 0 ? `sticky left-0 z-10 bg-white ${pinnedDivider} ${pinnedEdge}` : ""}`}>
                        <span className="inline-flex items-center gap-2">
                          {expansion && columnIndex === 0 && <ChevronRight aria-hidden="true" className={`size-4 shrink-0 text-[#488967] transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`} />}
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
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-[#e7eee9] bg-[#fbfdfb] px-4 py-2 text-xs text-[#416352] sm:px-5">
          <div className="flex items-center gap-2">
            <label htmlFor={`${tableId}-page-size`}>Rows per page</label>
            <select
              id={`${tableId}-page-size`}
              value={pageSize}
              onChange={(event) => changePagination(1, Number(event.target.value))}
              className="h-8 min-w-14 rounded border border-[#cfded3] bg-white px-2 text-[#284638] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58]"
            >
              {sizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span aria-live="polite" className="whitespace-nowrap">{sortedRows.length === 0 ? "0 of 0" : `${rangeStart}-${rangeEnd} of ${sortedRows.length}`}</span>
            <nav aria-label="Table pages" className="flex items-center gap-1">
              <button type="button" title="Previous page" aria-label="Previous page" disabled={currentPage === 0} onClick={() => changePagination(currentPage, pageSize)} className="inline-flex size-8 items-center justify-center rounded border border-[#dce8df] text-[#416352] hover:bg-[#edf5ef] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58]">
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" title="Next page" aria-label="Next page" disabled={currentPage >= pageCount - 1} onClick={() => changePagination(currentPage + 2, pageSize)} className="inline-flex size-8 items-center justify-center rounded border border-[#dce8df] text-[#416352] hover:bg-[#edf5ef] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58]">
                <ChevronRight className="size-4" />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
