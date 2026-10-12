"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsDown, ChevronsUp, ChevronsUpDown, RotateCcw } from "lucide-react";

export interface DataTableColumn<TRow> {
  id: string;
  header: ReactNode;
  accessor: keyof TRow | ((row: TRow) => unknown);
  render?: (row: TRow) => ReactNode;
  format?: "dateTime";
  sortable?: boolean;
  /** Width in pixels. */
  width?: number;
  mobileWidth?: number;
  tabletWidth?: number;
  pinned?: boolean;
}

type RowId = string | number;
export type DataTableSort = { columnId: string; direction: "asc" | "desc" } | null;

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
  renderExpanded?: (row: TRow, children: readonly TChild[]) => ReactNode;
}

type DataTableSortingProps =
  | { manualSorting?: false; sort?: DataTableSort; onSortChange?: (sort: DataTableSort) => void }
  | { manualSorting: true; sort: DataTableSort; onSortChange: (sort: DataTableSort) => void };

type DataTablePaginationProps =
  | {
      manualPagination?: false;
      totalCount?: never;
      page?: number;
      pageSize?: number;
      onPageChange?: (page: number) => void;
      onPageSizeChange?: (pageSize: number) => void;
    }
  | {
      manualPagination: true;
      totalCount: number;
      page: number;
      pageSize: number;
      onPageChange: (page: number) => void;
      onPageSizeChange: (pageSize: number) => void;
    };

export type DataTableProps<TRow, TChild> = DataTableBaseProps<TRow, TChild> & DataTableSortingProps & DataTablePaginationProps & (
  | { expansion?: undefined; getRowId?: (row: TRow) => RowId; getChildren?: never; loadChildren?: never }
  | { expansion: "inline"; getRowId: (row: TRow) => RowId; getChildren: (row: TRow) => readonly TChild[]; loadChildren?: never }
  | { expansion: "onDemand"; getRowId: (row: TRow) => RowId; getChildren?: never; loadChildren: (row: TRow) => Promise<readonly TChild[]> }
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
const sortCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const pinnedDivider = "after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-[#c5d7ca] after:content-[''] after:transition-opacity after:duration-150";
const pinnedEdgeVisible = "after:opacity-100 shadow-[3px_0_8px_-5px_rgba(31,78,53,0.18)]";
const pinnedEdgeHidden = "after:opacity-0";
const responsiveTableWidth = "min-w-[var(--table-width-mobile)] md:min-w-[var(--table-width-tablet)] lg:min-w-[var(--table-width-desktop)]";
const responsiveColumnWidth = "w-[var(--column-width-mobile)] md:w-[var(--column-width-tablet)] lg:w-[var(--column-width-desktop)]";

function PageSizePicker({ value, options, onChange }: { value: number; options: readonly number[]; onChange: (value: number) => void }) {
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuPosition) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) setMenuPosition(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPosition(null);
        buttonRef.current?.focus();
      }
    };
    const closeOnViewportChange = () => setMenuPosition(null);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", closeOnViewportChange, true);
    window.addEventListener("resize", closeOnViewportChange);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", closeOnViewportChange, true);
      window.removeEventListener("resize", closeOnViewportChange);
    };
  }, [menuPosition]);

  function toggleMenu() {
    if (menuPosition) {
      setMenuPosition(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = Math.min(options.length * 32 + 8, window.innerHeight - 16);
    const top = rect.top >= menuHeight + 8 ? rect.top - menuHeight - 4 : rect.bottom + 4;
    setMenuPosition({ top, left: Math.min(rect.left, window.innerWidth - Math.max(rect.width, 56) - 8), width: Math.max(rect.width, 56) });
  }

  return (
    <div className="flex items-center gap-2">
      <span>Rows per page</span>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Rows per page: ${value}`}
        aria-expanded={Boolean(menuPosition)}
        aria-controls={menuId}
        onClick={toggleMenu}
        className="inline-flex h-8 min-w-14 cursor-pointer items-center justify-between gap-2 rounded border border-[#cfded3] bg-white px-2 text-[#284638] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58]"
      >
        {value}<ChevronDown aria-hidden="true" className="size-4" />
      </button>
      {menuPosition && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="group"
          aria-label="Rows per page options"
          className="fixed z-50 max-h-[calc(100dvh-16px)] overflow-y-auto rounded border border-[#cfded3] bg-white p-1 shadow-md"
          style={menuPosition}
        >
          {options.map((size) => (
            <button
              key={size}
              type="button"
              aria-current={size === value ? "true" : undefined}
              onClick={() => {
                setMenuPosition(null);
                buttonRef.current?.focus();
                onChange(size);
              }}
              className="block h-8 w-full cursor-pointer rounded px-2 text-left text-[#284638] hover:bg-[#edf5ef] aria-current:bg-[#e1efe5] focus-visible:outline-2 focus-visible:outline-[#2b8a58]"
            >
              {size}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

type ColumnWidths = { mobile: number; tablet: number; desktop: number };

function getColumnWidths<TRow>(columns: DataTableColumn<TRow>[], pinnedColumnId: string | undefined, pinnedDefault: number, defaultWidth: number): ColumnWidths[] {
  return columns.map((column) => {
    const desktop = column.width ?? (column.id === pinnedColumnId ? pinnedDefault : defaultWidth);
    const tablet = column.tabletWidth ?? desktop;
    return { mobile: column.mobileWidth ?? tablet, tablet, desktop };
  });
}

function getFlexibleColumnIndex<TRow>(columns: DataTableColumn<TRow>[], pinnedColumnId: string | undefined): number {
  return columns.reduce((last, column, index) =>
    column.id !== pinnedColumnId && column.width === undefined && column.tabletWidth === undefined && column.mobileWidth === undefined ? index : last, -1);
}

function tableWidthStyle(widths: ColumnWidths[], minimum: number): CSSProperties {
  return {
    "--table-width-mobile": `${Math.max(minimum, widths.reduce((sum, width) => sum + width.mobile, 0))}px`,
    "--table-width-tablet": `${Math.max(minimum, widths.reduce((sum, width) => sum + width.tablet, 0))}px`,
    "--table-width-desktop": `${Math.max(minimum, widths.reduce((sum, width) => sum + width.desktop, 0))}px`,
  } as CSSProperties;
}

function columnWidthStyle(width: ColumnWidths): CSSProperties {
  return {
    "--column-width-mobile": `${width.mobile}px`,
    "--column-width-tablet": `${width.tablet}px`,
    "--column-width-desktop": `${width.desktop}px`,
  } as CSSProperties;
}

function SkeletonLine({ widthClass }: { widthClass: string }) {
  return <span aria-hidden="true" className={`block h-3 ${widthClass} rounded-sm bg-[#e1ebe4] animate-pulse motion-reduce:animate-none`} />;
}

function ExpandedColumnsTable<TChild>({ columns, rows }: { columns: DataTableColumn<TChild>[]; rows: readonly TChild[] | null }) {
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
    manualSorting = false,
  } = props;
  const [localSort, setLocalSort] = useState<DataTableSort>(null);
  const [pageIndex, setPageIndex] = useState(0);
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
  const sort = requestedSort && columns.some((column) => column.id === requestedSort.columnId && column.sortable !== false) ? requestedSort : null;
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
    const column = columns.find((item) => item.id === sort?.columnId && item.sortable !== false);
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
  const requestedPage = props.page ?? pageIndex + 1;
  const currentPage = Number.isInteger(requestedPage) ? Math.max(1, Math.min(requestedPage, pageCount)) : 1;
  const pagedRows = props.manualPagination ? sortedRows : sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = pagedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = pagedRows.length === 0 ? 0 : Math.min((currentPage - 1) * pageSize + pagedRows.length, totalRows);

  function changePage(nextPage: number) {
    if (props.page === undefined) setPageIndex(nextPage - 1);
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
    if (!columns.some((column) => column.id === columnId && column.sortable !== false)) return;
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
    <div className="mt-6 w-full overflow-hidden rounded-md border border-[#dce8df] bg-white">
      <div ref={scrollRef} className="w-full overflow-x-auto" onScroll={(event) => {
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
              const sortable = column.sortable !== false;
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
            return (
              <Fragment key={id}>
                <tr
                  onClick={expansion ? () => toggleRow(row, id) : undefined}
                  onKeyDown={expansion ? (event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " " || (event.key === "ArrowDown" && !expanded) || (event.key === "ArrowUp" && expanded)) {
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
                      <td key={column.id} className={`py-4 text-[#284638] transition-colors duration-150 group-hover/row:bg-[#f8fbf8] ${column.id === pinnedColumnId ? `sticky left-0 z-10 bg-white px-3 md:px-5 ${pinnedDivider} ${pinnedEdge}` : "px-5"}`}>
                        <span className="inline-flex items-center gap-2">
                          {expansion && columnIndex === 0 && <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-[#488967] transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />}
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
          <PageSizePicker value={pageSize} options={sizeOptions} onChange={changePageSize} />
          <div className="flex items-center gap-3">
            <span aria-live="polite" className="whitespace-nowrap">{totalRows === 0 ? "0 of 0" : `${rangeStart}-${rangeEnd} of ${totalRows}`}</span>
            <nav aria-label="Table pages" className="flex items-center gap-1">
              <button type="button" title="Previous page" aria-label="Previous page" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} className="inline-flex size-8 items-center justify-center rounded border border-[#dce8df] text-[#416352] hover:bg-[#edf5ef] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58]">
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" title="Next page" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => changePage(currentPage + 1)} className="inline-flex size-8 items-center justify-center rounded border border-[#dce8df] text-[#416352] hover:bg-[#edf5ef] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b8a58]">
                <ChevronRight className="size-4" />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
