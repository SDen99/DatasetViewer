# DataTable Component

## Component Structure

- DataTable.svelte (main container)
  - DataTableHeader.svelte (handles column operations)
  - DataTableBody.svelte (virtual scrolling container)
    - DataTableRow.svelte (individual rows)
  - ColumnHeader.svelte (individual column headers)
    - DragHandle.svelte
    - ResizeHandle.svelte
    - SortButton.svelte

## Key Features

- Virtual scrolling (handles large datasets)
- Column operations:
  - Sorting (single/multi)
  - Resizing
  - Reordering
- Row selection
- Responsive design

## State Management

The component uses several state mechanisms:

1. Internal state ($state)
2. Derived values ($derived)
3. External store (dataTableStore)

## Known Issues/Limitations

- Both Horizontal & Vertical Scrollbar are unnecessarily duplicated

## Planned Improvements

- Custom sort functions for specific columns
- Type-specific sorting (dates, custom types, etc.)
- Null/undefined value handling
