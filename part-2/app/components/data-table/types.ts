import type { ReactNode } from "react";

export interface DataTableColumn<TRow> {
  id: string;
  header: ReactNode;
  accessor: keyof TRow | ((row: TRow) => unknown);
  render?: (row: TRow) => ReactNode;
  sortable?: boolean;
  // width pixels
  width?: number;
  mobileWidth?: number;
  tabletWidth?: number;
  pinned?: boolean;
}

export type RowId = string | number;
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

export type ChildState<TChild> =
  | { status: "loading" }
  | { status: "ready"; children: readonly TChild[] }
  | { status: "error" };
