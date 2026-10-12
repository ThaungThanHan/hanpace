import type { CSSProperties, ReactNode } from "react";
import type { DataTableColumn } from "./types";

export function renderCell<TRow>(column: DataTableColumn<TRow>, row: TRow): ReactNode {
  if (column.render) return column.render(row);
  const value = typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor];
  return value == null ? "" : String(value);
}

export const skeletonWidths = ["w-3/4", "w-2/3", "w-1/2"];
export const defaultPageSizeOptions = [10, 25, 50];
export const sortCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
export const pinnedDivider = "after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-[#c5d7ca] after:content-[''] after:transition-opacity after:duration-150";
export const pinnedEdgeVisible = "after:opacity-100 shadow-[3px_0_8px_-5px_rgba(31,78,53,0.18)]";
export const pinnedEdgeHidden = "after:opacity-0";
export const responsiveTableWidth = "min-w-[var(--table-width-mobile)] md:min-w-[var(--table-width-tablet)] lg:min-w-[var(--table-width-desktop)]";
export const responsiveColumnWidth = "w-[var(--column-width-mobile)] md:w-[var(--column-width-tablet)] lg:w-[var(--column-width-desktop)]";

export type ColumnWidths = { mobile: number; tablet: number; desktop: number };

export function getColumnWidths<TRow>(columns: DataTableColumn<TRow>[], pinnedColumnId: string | undefined, pinnedDefault: number, defaultWidth: number): ColumnWidths[] {
  return columns.map((column) => {
    const desktop = column.width ?? (column.id === pinnedColumnId ? pinnedDefault : defaultWidth);
    const tablet = column.tabletWidth ?? desktop;
    return { mobile: column.mobileWidth ?? tablet, tablet, desktop };
  });
}

export function getFlexibleColumnIndex<TRow>(columns: DataTableColumn<TRow>[], pinnedColumnId: string | undefined): number {
  return columns.reduce((last, column, index) =>
    column.id !== pinnedColumnId && column.width === undefined && column.tabletWidth === undefined && column.mobileWidth === undefined ? index : last, -1);
}

export function tableWidthStyle(widths: ColumnWidths[], minimum: number): CSSProperties {
  return {
    "--table-width-mobile": `${Math.max(minimum, widths.reduce((sum, width) => sum + width.mobile, 0))}px`,
    "--table-width-tablet": `${Math.max(minimum, widths.reduce((sum, width) => sum + width.tablet, 0))}px`,
    "--table-width-desktop": `${Math.max(minimum, widths.reduce((sum, width) => sum + width.desktop, 0))}px`,
  } as CSSProperties;
}

export function columnWidthStyle(width: ColumnWidths): CSSProperties {
  return {
    "--column-width-mobile": `${width.mobile}px`,
    "--column-width-tablet": `${width.tablet}px`,
    "--column-width-desktop": `${width.desktop}px`,
  } as CSSProperties;
}
