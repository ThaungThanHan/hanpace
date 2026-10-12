# Part 2: Reusable Data Table

A reusable generic `DataTable` used by two fitness dashboard pages:

- **Timetable** — class sessions with on-demand attendee expansion
- **Members** — members with inline class-history expansion

Both pages use the same generic table component with different row types and data strategies.

## Setup

```bash
cd part-2
pnpm install
pnpm dev
```

Open:

- Timetable: http://localhost:3001/timetable
- Members: http://localhost:3001/members

## Component API and Column Definitions

The reusable component is:

```tsx
DataTable<TRow, TChild>
```

The noticable inputs are `columns` and `rows` needed to build a table. Other inputs include getRowId for stable row identity, expandedColumns or renderExpanded for child content, and loading, error, and onRetry for table states. Choose getChildren for inline expansion or loadChildren for on-demand expansion. Parents can control sort and pagination through sort/onSortChange and page/pageSize with callbacks; manualSorting and manualPagination additionally tell DataTable that the supplied rows are already sorted or paged. Manual pagination also requires totalCount.

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

`accessor` provides the value used for default rendering and sorting.

`render` can be used when the displayed value needs custom formatting instead of accessor value.

Sorting is optional and disabled by default.

## Client-side vs Server-side Strategy

The table supports both client-side and manual sorting/pagination. 

Client-side method can be used if you have small amount of data. It has longer initial load time but once loaded, the sorting and pagination speed are instant.

Server-side strategy is best fit for large amount of data. It would take a long time to fetch large data at first. Chunks of 5, 10 or a limit of your choice are fetched to ease the server and faster load.

### Timetable

Timetable uses controlled manual sorting and pagination.

Its state is stored in URL parameters such as:

```text
?page=1&limit=10&sort=name&dir=asc
```

The mock repository receives these values, sorts the complete dataset, slices the requested page, and returns the page rows with the total count.

This simulates server-side behavior without requiring a real backend.

### Members

Members table loads the complete dataset once.

The DataTable handles sorting and pagination internally in the browser.

This demonstrates the uncontrolled/client-side mode of the same component.

## Expandable Rows

The component supports two expansion strategies.

### Inline

Members uses inline expansion.

Class history is already included in each member row:

```tsx
expansion="inline"
getChildren={(member) => member.classHistory}
```

No additional request is required when the row opens.

### On-demand

Timetable loads attendees only when a class is expanded:

```tsx
expansion="onDemand"
loadChildren={(row) =>
  timetableRepository.getAttendees(row.id)
}
```

Each expanded row has its own:

- loading state
- error state
- Retry action
- cached result after a successful load

## Sticky Column Approach

Columns can opt into left pinning with:

```tsx
pinned: true
```

The first pinned column uses CSS:

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

Timetable owns its sorting and pagination state because it demonstrates manual/server-style behavior. It controls how data is fetched from mock repository before passing to the DataTable to render. 

Repository/data-fetching logic remains outside the generic DataTable so the component stays reusable and independent of a specific API.

## Tradeoffs and Assumptions

For the scope of this assessment:

- Only one pinned-left column is supported per table
- Expanded child tables do not have separate sorting or pagination
- Client-side mode is intended for moderate datasets
- Row virtualization is not implemented
- Mock repositories simulate asynchronous data but do not persist changes
- On-demand child data is cached only in the local state of the table to prevent re-fetching on expand.
