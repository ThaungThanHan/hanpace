# Part 2: Reusable Data Table

A reusable generic `DataTable` used by two fitness dashboard pages:

- **Timetable** — class sessions with on-demand attendee expansion
- **Members** — members with inline class-history expansion

Both pages use the same generic table component with different row types and data strategies.

## Setup

From the repository root:

```bash
pnpm install
pnpm dev:part-2
```

Open:

- Timetable: http://localhost:3001/timetable
- Members: http://localhost:3001/members

The root URL, http://localhost:3001, redirects to `/timetable`.

## Component API and Column Definitions

The reusable component is:

```tsx
DataTable<TRow, TChild>
```

The component lives in `app/components/data-table/DataTable.tsx`, with its public types in `types.ts` in the same directory. `columns` and `rows` are required; `TChild` can be omitted when expansion is unused.

- `getRowId` provides stable row identity and is required for either expansion mode.
- `expansion="inline"` requires `getChildren`; `expansion="onDemand"` requires `loadChildren`.
- `expandedColumns` renders a child table, while `renderExpanded` provides custom content. If both are supplied, nonempty `expandedColumns` takes precedence. Empty child results display “No details for this row.”
- `loading`, `error`, and `onRetry` control table-level loading and error states.
- Parents can control sorting through `sort`/`onSortChange` and pagination through `page`/`pageSize` with their change callbacks. Without controlled values, the table uses local state.
- `manualSorting` skips the table's internal sort and requires `sort` and `onSortChange`. `manualPagination` skips internal slicing and requires `totalCount`, `page`, `pageSize`, and both pagination callbacks.

A column defines:

```ts
interface DataTableColumn<TRow> {
  id: string;
  header: ReactNode;
  accessor: keyof TRow | ((row: TRow) => unknown);
  render?: (row: TRow) => ReactNode;
  sortable?: boolean;
  width?: number;
  mobileWidth?: number;
  tabletWidth?: number;
  pinned?: boolean;
}
```

Example:

```tsx
{
  id: "name",
  header: "Class",
  accessor: "name",
  sortable: true,
  pinned: true,
  width: 190,
  mobileWidth: 140,
}
```

`accessor` provides the value used for default rendering and client-side sorting. Default rendering converts values to strings, with null or undefined values shown as empty cells. In manual sorting mode, the parent/repository decides how each column ID maps to a sortable field.

`render` overrides cell display without changing the accessor used for sorting.

Sorting is disabled unless a column sets `sortable: true`. Clicking a sortable header cycles through ascending, descending, and unsorted, and resets the page to 1. Changing page size also resets the page to 1.

The generic table defaults to 10 rows per page with options of 10, 25, and 50. Both demo pages start with 2 rows per page and offer presets of 2, 5, and 10. A valid timetable `limit` URL parameter can select a different size.

## Client-side vs Server-side Strategy

The table supports both client-side and manual sorting/pagination.

In client-side mode, the table receives the complete row set and sorts and slices it in memory. Page and sort changes do not call the repository again.

In manual mode, the parent supplies rows that are already sorted and paged. This interface can be connected to a server API, but this demo uses imported mock data and asynchronous repositories that run in the browser. The full mock datasets are available locally; the demo does not measure network savings or guarantee that either strategy is faster.

### Timetable

Timetable uses controlled manual sorting and pagination.

Its state is stored in URL parameters such as:

```text
?page=1&limit=10&sort=name&dir=asc
```

The mock repository receives these values, sorts the complete dataset, slices the requested page, and returns the page rows with the total count.

This simulates server-side behavior without requiring a real backend.

Missing or invalid page and limit values fall back to page 1 and 2 rows per page. Invalid sort columns or directions are ignored. A page beyond the last available page is corrected in the URL after the repository returns its total count.

### Members

Members loads the complete dataset, including class history, when the page mounts. It can load again after a retry or remount.

The DataTable handles sorting and pagination internally in the browser.

This demonstrates the uncontrolled/client-side mode of the same component.

## Expandable Rows

The component supports two expansion strategies.

### Inline

Members uses inline expansion.

Class history is already included in each member row:

```tsx
expansion="inline"
getRowId={(member) => member.id}
getChildren={(member) => member.classHistory}
```

No additional request is required when the row opens.

### On-demand

Timetable loads attendees only when a class is expanded:

```tsx
expansion="onDemand"
getRowId={(row) => row.id}
loadChildren={(row) =>
  timetableRepository.getAttendees(row.id)
}
```

Each expanded row has its own:

- loading state
- error state
- Retry action
- cached result after a successful load

Collapsing and reopening a row reuses its result. A failed load stays in the error state until Retry is selected. Results are keyed by `getRowId` and remain cached across sorting and pagination while the table stays mounted; they are discarded on unmount and have no automatic refresh or invalidation.

The mock repositories introduce a 700 ms delay for class/member lists and a 600 ms delay for attendees. They do not intentionally simulate failures; the error UI handles rejected repository calls.

## Sticky Column Approach

Columns can opt into left pinning with:

```tsx
pinned: true
```

Only the first column marked `pinned: true` is pinned. It uses CSS:

```css
position: sticky;
left: 0;
```

The pinned cells use an opaque background so horizontally scrolling columns do not show underneath them.

A subtle divider/shadow appears after horizontal scrolling to make the pinned boundary clear.

Responsive column widths keep the pinned column narrower on small screens while the remaining table stays horizontally scrollable.

## State Management

No global state library is needed for this demo.

The DataTable owns local UI state when operating in uncontrolled mode, including:

- sort
- page
- page size
- expanded rows
- on-demand child results

Timetable reads sorting and pagination state from the URL, updates it through the browser history API, and calls the mock repository before passing rows to the table. Members leaves sorting and pagination state inside the table. Expansion state and on-demand child results are owned by the table in both modes.

Repository/data-fetching logic remains outside the generic DataTable so the component stays reusable and independent of a specific API.

## Tradeoffs and Assumptions

For the scope of this assessment:

- Only one pinned-left column is supported per table
- Expanded child tables do not have separate sorting or pagination
- Client-side mode is intended for moderate datasets
- Row virtualization is not implemented
- Mock repositories simulate asynchronous data but do not persist changes
- On-demand child data is cached only in the local state of the table to prevent re-fetching on expand.

## Checks

Run lint and TypeScript checks from the repository root:

```bash
pnpm --filter part-2 lint
pnpm --filter part-2 typecheck
```

No automated tests or test script are currently included for part-2.
