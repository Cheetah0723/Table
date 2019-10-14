# API

React Table uses React Hooks both internally and externally for almost all of its configuration and lifecycle management. Naturally, this is what allows React Table to be headless and lightweight while still having a concise and simple API.

React Table is essentially a compatible collection of **custom React hooks**:

- The primary React Table hook
  - [`useTable`](#usetable)
- Plugin Hooks
  - Core Plugin Hooks
    - [`useGroupBy`](#useGroupBy)
    - [`useFilters`](#useFilters)
    - [`useSortBy`](#useSortBy)
    - [`useExpanded`](#useExpanded)
    - [`usePagination`](#usePagination)
    - [`useRowSelect`](#useRowSelect)
    - [`useRowState`](#useRowState)
    - [`useColumnOrder`](#useColumnOrder)
  - Layout Hooks
    - [`useBlockLayout`](#useBlockLayout)
    - [`useAbsoluteLayout`](#useAbsoluteLayout)
    - [`useResizeColumns`](#useResizeColumns)
- 3rd Party Plugin Hooks
  - Want your custom plugin hook listed here? [Submit a PR!](https://github.com/tannerlinsley/react-table/compare)

### Hook Usage

`useTable` is the **primary** hook used to build a React Table. It serves as the starting point for **every option and every plugin hook** that React Table supports. The options passed into `useTable` are supplied to every plugin hook after it in the order they are supplied, eventually resulting a final `instance` object that you can use to build your table UI and interact with the table's state.

```js
const instance = useTable(
  {
    data: [...],
    columns: [...],
  },
  useGroupBy,
  useFilters,
  useSortBy,
  useExpanded,
  usePagination
)
```

### The stages of a React Table

1. `useTable` is called. A table instance is created.
1. The `instance.state` is resolved from either a custom user state or an automatically generated one.
1. A collection of plugin points is created at `instance.hooks`.
1. Each plugin is given the opportunity to add hooks to `instance.hook`.
1. As the `useTable` logic proceeds to run, each plugin hook type is used at a specific point in time with each individual hook function being executed the order it was registered.
1. The final instance object is returned from `useTable`, which the developer then uses to construct their table.

This multi-stage process is the secret sauce that allows React Table plugin hooks to work together and compose nicely, while not stepping on each others toes.

To dive deeper into plugins, see Plugins](TODO) and the [Plugin Guide

### Plugin Hook Order & Consistency

The order and usage of plugin hooks must follow The Laws of Hooks, just like any other custom hook. They must always be unconditionally called in the same order.

> **NOTE: In the event that you want to programmatically enable or disable plugin hooks, most of them provide options to disable their functionality, eg. `options.disableSorting`**

### Option Memoization

React Table relies on memoization to determine when state and side effects should update or be calculated. This means that every option you pass to `useTable` should be memoized either via `React.useMemo` (for objects) or `React.useCallback` (for functions).

# `useTable`

- Required

`useTable` is the root hook for React Table. To use it, pass it with an options object with at least a `columns` and `rows` value, followed by any React Table compatible hooks you want to use.

### Table Options

The following options are supported via the main options object passed to `useTable(options)`

- `columns: Array<Column>`
  - Required
  - Must be **memoized**
  - The core columns configuration object for the entire table.
  - Supports nested `columns` arrays via the column's `columns` key, eg. `[{ Header: 'My Group', columns: [...] }]`
- `data: Array<any>`
  - Required
  - Must be **memoized**
  - The data array that you want to display on the table.
- `initialState: Object`
  - Optional
  - The initial state object for the table.
  - Upon table initialization, this object is **merged over the table's `defaultState` object** (eg. `{...defaultState, ...initialState}`) that React Table and its hooks use to register default state to produce the final initial state object passed to the `React.useState` hook internally.
- `state: Object`
  - Optional
  - Must be **memoized**
  - When either the internal `state` or this `state` object change, this object is **always merged over the internal table state** (eg. `{...state, ...overrides}`) to produce the final state object that is then passed to the `useTable` options.
- `reducer: Function(oldState, newState) => finalState`
  - Optional
  - Inspired by Kent C. Dodd's [State Reducer Pattern](https://kentcdodds.com/blog/the-state-reducer-pattern-with-react-hooks)
  - With every `setState` call to the table's internal `React.useState` instance, this reducer is called and is allowed to modify the final state object for updating.
  - It is passed the `oldState`, the `newState`, and when provided, an optional action `type`.
- `defaultColumn: Object`
  - Optional
  - Defaults to `{}`
  - The default column object for every column passed to React Table.
  - Column-specific properties will override the properties in this object, eg. `{ ...defaultColumn, ...userColumn }`
  - This is particularly useful for adding global column properties. For instance, when using the `useFilters` plugin hook, add a default `Filter` renderer for every column, eg.`{ Filter: MyDefaultFilterComponent }`
- `initialRowStateKey: String`
  - Optional
  - Defaults to `initialState`
  - This key is used to look for the initial state of a row when initializing the `rowState` for a`data` array.
  - If the value located at `row[initialRowStateKey]` is falsey, `{}` will be used instead.
- `getSubRows: Function(row, relativeIndex) => Rows[]`
  - Optional
  - Must be **memoized**
  - Defaults to `(row) => row.subRows || []`
  - Use this function to change how React Table detects subrows. You could even use this function to generate sub rows if you want.
  - By default, it will attempt to return the `subRows` property on the row, or an empty array if that is not found.
- `getRowID: Function(row, relativeIndex) => string`
  - Use this function to change how React Table detects unique rows and also how it constructs each row's underlying `path` property.
  - Optional
  - Must be **memoized**
  - Defaults to `(row, relativeIndex) => relativeIndex`
  - You may want to change this function if
  - By default, it will use the `index` of the row within it's original array.
- `debug: Bool`
  - Optional
  - A flag to turn on debug mode.
  - Defaults to `false`

### Column Options

The following options are supported on any column object you can pass to `columns`.

- `accessor: String | Function`
  - **Required**
  - This string/function is used to build the data model for your column.
  - The data returned by an accessor should be **primitive** and sortable.
  - If a string is passed, the column's value will be looked up on the original row via that key, eg. If your column's accessor is `firstName` then its value would be read from `row['firstName']`. You can also specify deeply nested values with accessors like `info.hobbies` or even `address[0].street`
  - If a function is passed, the column's value will be looked up on the original row using this accessor function, eg. If your column's accessor is `row => row.firstName`, then its value would be determined by passing the row to this function and using the resulting value.
- `id: String`
  - **Required if `accessor` is a function**
  - This is the unique ID for the column. It is used by reference in things like sorting, grouping, filtering etc.
  - If a **string** accessor is used, it defaults as the column ID, but can be overridden if necessary.
- `columns: Array<Column>`
  - Optional
  - A nested array of columns.
  - If defined, the column will act as a header group. Columns can be recursively nested as much as needed.
- `show: Boolean | Function`
  - Optional
  - Defaults to `true`
  - If set to `false`, the column will be hidden.
  - If set to a `function`, it will be called with the current table instance and can then return `true` or `false`.
  - The data model for hidden columns is still calculated including sorting, filters, and grouping.
- `Header: String | Function | React.Component => JSX`
  - Optional
  - Defaults to `() => null`
  - Receives the table instance and column model as props
  - Must either be a **string or return valid JSX**
  - If a function/component is passed, it will be used for formatting the header value, eg. You can use a `Header` function to dynamically format the header using any table or column state.
- `Cell: Function | React.Component => JSX`
  - Optional
  - Defaults to `({ cell: { value } }) => String(value)`
  - Receives the table instance and cell model as props
  - Must return valid JSX
  - This function (or component) is primarily used for formatting the column value, eg. If your column accessor returns a date object, you can use a `Cell` function to format that date to a readable format.
- `width: Int`
  - Optional
  - Defaults to `150`
  - Specifies the width for the column (when using non-table-element layouts)
- `minWidth: Int`
  - Optional
  - Defaults to `0`
  - Specifies the minimum width for the column (when using non-table-element layouts)
  - Specifically useful when using plugin hooks that allow the user to resize column widths
- `maxWidth: Int`
  - Optional
  - Defaults to `0`
  - Specifies the maximum width for the column (when using non-table-element layouts)
  - Specifically useful when using plugin hooks that allow the user to resize column widths

### Instance Properties

The following properties are available on the table instance returned from `useTable`

- `state: Object`
  - **Memoized** - This object reference will not change unless either the internal state or the `state` overrides option provided change.
  - This is the final state object of the table, which is the product of the `initialState`, internal state, optional `state` overrides option and the `reducer` option (if applicable).
- `setState: Function(updater, type) => void`
  - **Memoized** - This function reference will not change unless the internal state `reducer` is changed
  - This function is used both internally by React Table, and optionally by you (the developer) to update the table state programmatically.
  - `updater: Function`
    - This parameter is identical to the `setState` API exposed by `React.useState`.
      - If a function is passed, that function will be called with the previous state and is expected to return a new version of the state.
      - If a value is passed, it will replace the state entirely.
  - `type: String`
    - Optional
    - The action type corresponding to what action being taken against the state.
- `columns: Array<Column>`
  - A **nested** array of final column objects, **similar in structure to the original columns configuration option**.
  - See [Column Properties](#column-properties) for more information
- `flatColumns: Array<Column>`
  - A **flat** array of all final column objects.
  - See [Column Properties](#column-properties) for more information
- `headerGroups: Array<HeaderGroup>`
  - An array of normalized header groups, each containing a flattened array of final column objects for that row.
  - **Some of these headers may be materialized as placeholders**
  - See [Header Group Properties](#headergroup-properties) for more information
- `headers: Array<Column>`
  - An **nested** array of final header objects, **similar in structure to the original columns configuration option, but rebuilt for ordering**
  - Each contains the headers that are displayed underneath it.
  - **Some of these headers may be materialized as placeholders**
  - See [Column Properties](#column-properties) for more information
- `flatHeaders[] Array<Column>`
  - A **flat** array of final header objects found in each header group.
  - **Some of these headers may be materialized as placeholders**
  - See [Column Properties](#column-properties) for more information
- `rows: Array<Row>`
  - An array of **materialized row objects** from the original `data` array and `columns` passed into the table options
  - See [Row Properties](#row-properties) for more information
- `getTableProps: Function(?props)`
  - **Required**
  - This function is used to resolve any props needed for your table wrapper.
  - Custom props may be passed. **NOTE: Custom props will override built-in table props, so be careful!**
- `getTableBodyProps: Function(?props)`
  - **Required**
  - This function is used to resolve any props needed for your table body wrapper.
  - Custom props may be passed. **NOTE: Custom props will override built-in table body props, so be careful!**
- `prepareRow: Function(Row)`
  - **Required**
  - This function is responsible for lazily preparing a row for rendering. Any row that you intend to render in your table needs to be passed to this function **before every render**.
  - **Why?** Since table data could potentially be very large, it can become very expensive to compute all of the necessary state for every row to be rendered regardless if it actually is rendered or not (for example if you are paginating or virtualizing the rows, you may only have a few rows visible at any given moment). This function allows only the rows you intend to display to be computed and prepped with the correct state.
- `flatRows: Array<Row>`
  - An array of all rows, including subRows which have been flattened into the order in which they were detected (depth first)
  - This can be helpful in calculating total row counts that must include subRows
- `totalColumnsWidth: Int`
  - This is the total width of all visible columns (when using non-table-element layouts)
- `setRowState: Function(rowPath, updater: Function | any) => void`
  - This function can be used to update the internal state for any row.
  - Pass it a valid `rowPath` array and `updater`. The `updater` may be a value or function, similar to `React.useState`'s usage.
  - If `updater` is a function, it will be passed the previous value
- `setCellState: Function(rowPath, columnID, updater: Function | any) => void`
  - This function can be used to update the internal state for any cell.
  - Pass it a valid `rowPath` array, `columnID` and `updater`. The `updater` may be a value or function, similar to `React.useState`'s usage.
  - If `updater` is a function, it will be passed the previous value

### HeaderGroup Properties

The following additional properties are available on every `headerGroup` object returned by the table instance.

- `headers: Array<Column>`
  - **Required**
  - The columns in this header group.
- `getHeaderGroupProps: Function(?props)`
  - **Required**
  - This function is used to resolve any props needed for this header group's row.
  - You can use the `getHeaderGroupProps` hook to extend its functionality.
  - Custom props may be passed. **NOTE: Custom props will override built-in table props, so be careful!**

### Column Properties

The following properties are available on every `Column` object returned by the table instance.

- `id: String`
  - The resolved column ID from either the column's `accessor` or the column's hard-coded `id` property
- `isVisible: Boolean`
  - The resolved visible state for the column, derived from the column's `show` property
- `render: Function(type: String | Function | Component, ?props)`
  - This function is used to render content with the added context of a column.
  - The entire table `instance` will be passed to the renderer with the addition of a `column` property, containing a reference to the column
  - If `type` is a string, will render using the `column[type]` renderer. React Table ships with default `Header` renderers. Other renderers like `Filter` are available via hooks like `useFilters`.
  - If a function or component is passed instead of a string, it will be be passed the table instance and column model as props and is expected to return any valid JSX.
- `totalLeft: Int`
  - This is the total width in pixels of all columns to the left of this column
  - Specifically useful when using plugin hooks that allow the user to resize column widths
- `totalWidth: Int`
  - This is the total width in pixels for this column (if it is a leaf-column) or or all of it's sub-columns (if it is a column group)
  - Specifically useful when using plugin hooks that allow the user to resize column widths
- `getHeaderProps: Function(?props)`
  - **Required**
  - This function is used to resolve any props needed for this column's header cell.
  - You can use the `getHeaderProps` hook to extend its functionality.
  - Custom props may be passed. **NOTE: Custom props will override built-in table props, so be careful!**

### Row Properties

The following additional properties are available on every `row` object returned by the table instance.

- `cells: Array<Cell>`
  - An array of `Cell` objects containing properties and functions specific to the row and column it belongs to.
  - See [Cell Properties](#cell-properties) for more information
- `values: Object<columnID: any>`
  - A map of this row's **resolved** values by columnID, eg. `{ firstName: 'Tanner', lastName: 'Linsley' }`
- `getRowProps: Function(?props)`
  - **Required**
  - This function is used to resolve any props needed for this row.
  - You can use the `getRowProps` hook to extend its functionality.
  - Custom props may be passed. **NOTE: Custom props will override built-in table props, so be careful!**
- `index: Int`
  - The index of the original row in the `data` array that was passed to `useTable`. If this row is a subRow, it is the original index within the parent row's subRows array
- `original: Object`
  - The original row object from the `data` array that was used to materialize this row.
- `path: Array<string>`
  - This array is the sequential path of indices one could use to navigate to it, eg. a row path of `[3, 1, 0]` would mean that it is the **first** subRow of a parent that is the **second** subRow of a parent that is the **fourth** row in the original `data` array.
  - This array is used with plugin hooks like `useExpanded` and `useGroupBy` to compute expanded states for individual rows.
- `subRows: Array<Row>`
  - If subRows were detect on the original data object, this will be an array of those materialized row objects.
- `state: Object`

  - The current state of the row. It's lifespan is attached to that of the original `data` array. When the raw `data` is changed, this state value is reset to the row's initial value (using the `initialRowStateKey` option).
  - Can be updated via `instance.setRowState` or the row's `setState` function.

### Cell Properties

The following additional properties are available on every `Cell` object returned in an array of `cells` on every row object.

- `column: Column`
  - The corresponding column object for this cell
- `row: Row`
  - The corresponding row object for this cell
- `value: any`
  - The **resolved** value for this cell.
  - By default, this value is displayed on the table via the default `Cell` renderer. To override the way a cell displays
- `getCellProps: Function(?props)`
  - **Required**
  - This function is used to resolve any props needed for this cell.
  - You can use the `getCellProps` hook to extend its functionality.
  - Custom props may be passed. **NOTE: Custom props will override built-in table props, so be careful!**
- `render: Function(type: String | Function | Component, ?props)`
  - **Required**
  - This function is used to render content with the added context of a cell.
  - The entire table `instance` will be passed to the renderer with the addition of `column`, `row` and `cell` properties, containing a reference to each respective item.
  - If `type` is a string, will render using the `column[type]` renderer. React Table ships with a default `Cell` renderer. Other renderers like `Aggregated` are available via hooks like `useFilters`.
  - If a function or component is passed instead of a string, it will be be passed the table instance and cell model as props and is expected to return any valid JSX.

### Example

- [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/basic)
- [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/basic)

# `useSortBy`

- Plugin Hook
- Optional

`useSortBy` is the hook that implements **row sorting**. It also support multi-sort (keyboard required).

- Multi-sort is enabled by default
- To sort the table via UI, attach the props generated from each column's `getSortByToggleProps()`, then click any of those elements.
- To multi-sort the table via UI, hold `shift` while clicking on any of those same elements that have the props from `getSortByToggleProps()` attached.
- To programmatically sort (or multi-sort) any column, use the `toggleSortBy` method located on the instance or each individual column.

### Table Options

The following options are supported via the main options object passed to `useTable(options)`

- `state.sortBy: Array<Object<id: columnID, desc: Bool>>`
  - Must be **memoized**
  - An array of sorting objects. If there is more than one object in the array, multi-sorting will be enabled. Each sorting object should contain an `id` key with the corresponding column ID to sort by. An optional `desc` key may be set to true or false to indicated ascending or descending sorting for that column. This information is stored in state since the table is allowed to manipulate the filter through user interaction.
- `initialState.sortBy`
  - Identical to the `state.sortBy` option above
- `manualSorting: Bool`
  - Enables sorting detection functionality, but does not automatically perform row sorting. Turn this on if you wish to implement your own sorting outside of the table (eg. server-side or manual row grouping/nesting)
- `disableSorting: Bool`
  - Disables sorting for every column in the entire table.
- `disableMultiSort: Bool`
  - Disables multi-sorting for the entire table.
- `isMultiSortEvent: Function`
  - Allows to override default multisort behaviour(i.e. multisort applies when shift key is pressed), if this function is provided then returned boolean value from this function will make decision whether newly applied sort action will be considered as multisort or not.
  - Receives `event` as argument.
- `maxMultiSortColCount: Number`
  - Limit on max number of columns for multisort, e.g. if set to 3, and suppose table is sorted by `[A, B, C]` and then clicking `D` for sorting should result in table sorted by `[B, C , D]`
- `disableSortRemove: Bool`
  - If true, the un-sorted state will not be available to columns once they have been sorted.
- `disableMultiRemove: Bool`
  - If true, the un-sorted state will not be available to multi-sorted columns.
- `orderByFn: Function`
  - Must be **memoized**
  - Defaults to the built-in default orderBy function
  - This function is responsible for composing multiple sorting functions together for multi-sorting, and also handles both the directional sorting and stable-sorting tie breaking. Rarely would you want to override this function unless you have a very advanced use-case that requires it.
- `sortTypes: Object<sortKey: sortType>`
  - Must be **memoized**
  - Allows overriding or adding additional sort types for columns to use. If a column's sort type isn't found on this object, it will default to using the built-in sort types.
  - For more information on sort types, see Sorting

### Column Options

The following options are supported on any `Column` object passed to the `columns` options in `useTable()`

- `disableSorting: Bool`
  - Optional
  - Defaults to `false`
  - If set to `true`, the sorting for this column will be disabled
- `sortDescFirst: Bool`
  - Optional
  - Defaults to `false`
  - If set to `true`, the first sort direction for this column will be descending instead of ascending
- `sortInverted: Bool`
  - Optional
  - Defaults to `false`
  - If set to `true`, the underlying sorting direction will be inverted, but the UI will not.
  - This may be useful in situations where positive and negative connotation is inverted, eg. a Golfing score where a lower score is considered more positive than a higher one.
- `sortType: String | Function`
  - Used to compare 2 rows of data and order them correctly.
  - If a **function** is passed, it must be **memoized**
  - String options: `basic`, `datetime`, `alphanumeric`. Defaults to `alphanumeric`.
  - The resolved function from the this string/function will be used to sort the this column's data.
    - If a `string` is passed, the function with that name located on either the custom `sortTypes` option or the built-in sorting types object will be used.
    - If a `function` is passed, it will be used.
  - For more information on sort types, see Sorting

### Instance Properties

The following values are provided to the table `instance`:

- `rows: Array<Row>`
  - An array of **sorted** rows.
- `preSortedRows: Array<Row>`
  - The array of rows that were originally sorted.
- `toggleSortBy: Function(ColumnID: String, descending: Bool, isMulti: Bool) => void`
  - This function can be used to programmatically toggle the sorting for any specific column

### Column Properties

The following properties are available on every `Column` object returned by the table instance.

- `canSort: Bool`
  - Denotes whether a column is sortable or not depending on if it has a valid accessor/data model or is manually disabled via an option.
- `toggleSortBy: Function(descending, multi) => void`
  - This function can be used to programmatically toggle the sorting for this column.
  - This function is similar to the `instance`-level `toggleSortBy`, however, passing a columnID is not required since it is located on a `Column` object already.
- `getSortByToggleProps: Function(props) => props`
  - **Required**
  - This function is used to resolve any props needed for this column's UI that is responsible for toggling the sort direction when the user clicks it.
  - You can use the `getSortByToggleProps` hook to extend its functionality.
  - Custom props may be passed. **NOTE: Custom props may override built-in sortBy props, so be careful!**
- `clearSorting: Function() => void`
  - This function can be used to programmatically clear the sorting for this column.
- `isSorted: Boolean`
  - Denotes whether this column is currently being sorted
- `sortedIndex: Int`
  - If the column is currently sorted, this integer will be the index in the `sortBy` array from state that corresponds to this column.
  - If this column is not sorted, the index will always be `-1`
- `isSortedDesc: Bool`
  - If the column is currently sorted, this denotes whether the column's sort direction is descending or not.
  - If `true`, the column is sorted `descending`
  - If `false`, the column is sorted `ascending`
  - If `undefined`, the column is not currently being sorted.

### Example

- [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/sorting)
- [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/sorting)

# `useFilters`

- Plugin Hook
- Optional

`useFilters` is the hook that implements **row filtering**.

### Table Options

The following options are supported via the main options object passed to `useTable(options)`

- `state.filters: Object<columnID: filterValue>`
  - Must be **memoized**
  - An object of columnID's and their corresponding filter values. This information is stored in state since the table is allowed to manipulate the filter through user interaction.
- `initialState.filters`
  - Identical to the `state.filters` option above
- `manualFilters: Bool`
  - Enables filter detection functionality, but does not automatically perform row filtering.
  - Turn this on if you wish to implement your own row filter outside of the table (eg. server-side or manual row grouping/nesting)
- `disableFilters: Bool`
  - Disables filtering for every column in the entire table.
- `filterTypes: Object<filterKey: filterType>`
  - Must be **memoized**
  - Allows overriding or adding additional filter types for columns to use. If a column's filter type isn't found on this object, it will default to using the built-in filter types.
  - For more information on filter types, see Filtering

### Column Options

The following options are supported on any `Column` object passed to the `columns` options in `useTable()`

- `Filter: Function | React.Component => JSX`
  - **Required**
  - Receives the table instance and column model as props
  - Must return valid JSX
  - This function (or component) is used to render this column's filter UI, eg.
- `disableFilters: Bool`
  - Optional
  - If set to `true`, will disable filtering for this column
- `filter: String | Function`
  - Optional
  - Defaults to `text`
  - The resolved function from the this string/function will be used to filter the this column's data.
    - If a `string` is passed, the function with that name located on either the custom `filterTypes` option or the built-in filtering types object will be used. If
    - If a `function` is passed, it will be used directly.
  - For more information on filter types, see Filtering
  - If a **function** is passed, it must be **memoized**

### Instance Properties

The following values are provided to the table `instance`:

- `rows: Array<Row>`
  - An array of **filtered** rows.
- `preFilteredRows: Array<Row>`
  - The array of rows **used right before filtering**.
  - Among many other use-cases, these rows are directly useful for building option lists in filters, since the resulting filtered `rows` do not contain every possible option.
- `setFilter: Function(columnID, filterValue) => void`
  - An instance-level function used to update the filter value for a specific column.
- `setAllFilters: Function(filtersObject) => void`
  - An instance-level function used to update the values for **all** filters on the table, all at once.

### Column Properties

The following properties are available on every `Column` object returned by the table instance.

- `canFilter: Bool`
  - Denotes whether a column is filterable or not depending on if it has a valid accessor/data model or is manually disabled via an option.
- `setFilter: Function(filterValue) => void`
  - An column-level function used to update the filter value for this column
- `filterValue: any`
  - The current filter value for this column, resolved from the table state's `filters` object
- `preFilteredRows: Array<row>`
  - The array of rows that were originally passed to this columns filter **before** they were filtered.
  - This array of rows can be useful if building faceted filter options.
- `filteredRows: Array<row>`
  - The resulting array of rows received from this columns filter **after** they were filtered.
  - This array of rows can be useful if building faceted filter options.

### Example

- [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/filtering)
- [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/filtering)

# `useGroupBy`

- Plugin Hook
- Optional

`useGroupBy` is the hook that implements **row grouping and aggregation**.

- Each column's `getGroupByToggleProps()` function can be used to generate the props needed to make a clickable UI element that will toggle the grouping on or off for a specific column.
- Instance and column-level `toggleGroupBy` functions are also made available for programmatic grouping.

### Table Options

The following options are supported via the main options object passed to `useTable(options)`

- `state.groupBy: Array<String>`
  - Must be **memoized**
  - An array of groupBy ID strings, controlling which columns are used to calculate row grouping and aggregation. This information is stored in state since the table is allowed to manipulate the groupBy through user interaction.
- `initialState.groupBy`
  - Identical to the `state.groupBy` option above
- `manualGroupBy: Bool`
  - Enables groupBy detection and functionality, but does not automatically perform row grouping.
  - Turn this on if you wish to implement your own row grouping outside of the table (eg. server-side or manual row grouping/nesting)
- `disableGrouping: Bool`
  - Disables groupBy for the entire table.
- `aggregations: Object<aggregationKey: aggregationFn>`
  - Must be **memoized**
  - Allows overriding or adding additional aggregation functions for use when grouping/aggregating row values. If an aggregation key isn't found on this object, it will default to using the built-in aggregation functions
- `groupByFn: Function`
  - Must be **memoized**
  - Defaults to `defaultGroupByFn`
  - This function is responsible for grouping rows based on the `state.groupBy` keys provided. It's very rare you would need to customize this function.

### Column Options

The following options are supported on any `Column` object passed to the `columns` options in `useTable()`

- `Aggregated: Function | React.Component => JSX`
  - Optional
  - Defaults to this column's `Cell` formatter
  - Receives the table instance and cell model as props
  - Must return valid JSX
  - This function (or component) formats this column's value when it is being grouped and aggregated, eg. If this column was showing the number of visits for a user to a website and it was currently being grouped to show an **average** of the values, the `Aggregated` function for this column could format that value to `1,000 Avg. Visits`
- `disableGrouping: Boolean`
  - Defaults to `false`
  - If `true`, will disable grouping for this column.

### Instance Properties

The following values are provided to the table `instance`:

- `rows: Array<Row>`
  - An array of **grouped and aggregated** rows.
- `preGroupedRows: Array<Row>`
  - The array of rows originally used to create the grouped rows.
- `toggleGroupBy: Function(columnID: String, ?set: Bool) => void`
  - This function can be used to programmatically set or toggle the groupBy state for a specific column.

### Column Properties

The following properties are available on every `Column` object returned by the table instance.

- `canGroupBy: Boolean`
  - If `true`, this column is able to be grouped.
  - This is resolved from the column having a valid accessor / data model, and not being manually disabled via other `useGroupBy` related options
- `isGrouped: Boolean`
  - If `true`, this column is currently being grouped
- `groupedIndex: Int`
  - If this column is currently being grouped, this integer is the index of this column's ID in the table state's `groupBy` array.
- `toggleGroupBy: Function(?set: Bool) => void`
  - This function can be used to programmatically set or toggle the groupBy state fo this column.
- `getGroupByToggleProps: Function(props) => props`
  - **Required**
  - This function is used to resolve any props needed for this column's UI that is responsible for toggling grouping when the user clicks it.
  - You can use the `getGroupByToggleProps` hook to extend its functionality.
  - Custom props may be passed. **NOTE: Custom props may override built-in sortBy props, so be careful!**

### Row Properties

The following properties are available on every `Row` object returned by the table instance.

- `groupByID: String`
  - The column ID for which this row is being grouped.
  - Will be `undefined` if the row is an original row from `data` and not a materialized one from the grouping.
- `groupByVal: any`
  - If the row is a materialized group row, this will be the grouping value that was used to create it.
- `values: Object`
  - Similar to a regular row, a materialized grouping row also has a `values` object
  - This object contains the **aggregated** values for this row's sub rows
- `subRows: Array<Row>`
  - If the row is a materialized group row, this property is the array of materialized subRows that were grouped inside of this row.
- `depth: Int`
  - If the row is a materialized group row, this is the grouping depth at which this row was created.
- `path: Array<String|Int>`
  - Similar to normal `Row` objects, materialized grouping rows also have a path array. The keys inside it though are not integers like nested normal rows though. Since they are not rows that can be traced back to an original data row, they are given a unique path based on their `groupByVal`
  - If a row is a grouping row, it will have a path like `['Single']` or `['Complicated', 'Anderson']`, where `Single`, `Complicated`, and `Anderson` would all be derived from their row's `groupByVal`.
- `isAggregated: Bool`
  - Will be `true` if the row is an aggregated row

### Cell Properties

The following additional properties are available on every `Cell` object returned in an array of `cells` on every row object.

- `isGrouped: Bool`
  - If `true`, this cell is a grouped cell, meaning it contains a grouping value and should usually display and expander.
- `isRepeatedValue: Bool`
  - If `true`, this cell is a repeated value cell, meaning it contains a value that is already being displayed elsewhere (usually by a parent row's cell).
  - Most of the time, this cell is not required to be displayed and can safely be hidden during rendering
- `isAggregated: Bool`
  - If `true`, this cell's value has been aggregated and should probably be rendered with the `Aggregated` cell renderer.

### Example

- [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/grouping)
- [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/grouping)

# `useExpanded`

- Plugin Hook
- Optional

`useExpanded` is the hook that implements **row expanding**. It is most often used with `useGroupBy` to expand grouped rows or on its own with nested `subRows` in tree-like `data` sets, but is not limited to these use-cases. It supports expanding rows both via internal table state and also via a hard-coded key on the raw row model.

### Table Options

The following options are supported via the main options object passed to `useTable(options)`

- `state.expanded: Array<pathKey: String>`
  - Optional
  - Must be **memoized**
  - An array of expanded path keys.
  - If a row's path key (`row.path.join('.')`) is present in this array, that row will have an expanded state. For example, if `['3']` was passed as the `expanded` state, the **4th row in the original data array** would be expanded.
  - For nested expansion, you may **join the row path with a `.`** to expand sub rows. For example, if `['3', '3.5']` was passed as the `expanded` state, then the **6th subRow of the 4th row and also the 4th row of the original data array** would be expanded.
  - This information is stored in state since the table is allowed to manipulate the filter through user interaction.
- `initialState.expanded`
  - Identical to the `state.expanded` option above
- `getSubRows: Function(row, relativeIndex) => Rows[]`
  - Optional
  - See the [useTable hook](#table-options) for more details
- `manualExpandedKey: String`
  - Optional
  - Defaults to `expanded`
  - This string is used as the key to detect manual expanded state on any given row. For example, if a raw data row like `{ name: 'Tanner Linsley', friends: [...], expanded: true}` was detected, it would always be expanded, regardless of state.
- `expandSubRows: Bool`
  - Optional
  - Defaults to `true`
  - If set to `true`, expanded rows are rendered along with normal rows.
  - If set to `false`, expanded rows will only be available through their parent row. This could be useful if you are implementing a custom expanded row view.

### Instance Properties

The following properties are available on the table instance returned from `useTable`

- `rows: Array<Row>`
  - An array of **sorted** rows.

### Row Properties

The following additional properties are available on every `row` object returned by the table instance.

- `isExpanded: Bool`
  - If `true`, this row is in an expanded state.
- `toggleExpanded: Function(?isExpanded: Bool) => void`
  - This function will toggle the expanded state of a row between `true` and `false` or, if an `isExpanded` boolean is passed to the function, it will be set as the new `isExpanded` value.
  - Rows with a hard-coded `manualExpandedKey` (defaults to `expanded`) set to `true` are not affected by this function or the internal expanded state.

### Example

- [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/expanding)
- [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/expanding)

# `usePagination`

- Plugin Hook
- Optional

`usePagination` is the hook that implements **row pagination**. It can be used for both client-side pagination or server-side pagination. For more information on pagination, see Pagination

> **NOTE** Some server-side pagination implementations do not use page index and instead use **token based pagination**! If that's the case, please use the `useTokenPagination` plugin instead.

### Table Options

The following options are supported via the main options object passed to `useTable(options)`

- `state.pageSize: Int`
  - **Required**
  - Defaults to `10`
  - Determines the amount of rows on any given page
- `initialState.pageSize`
  - Identical to the `state.pageSize` option above
- `state.pageIndex: Int`
  - **Required**
  - Defaults to `0`
  - The index of the page that should be displayed via the `page` instance value
- `initialState.pageIndex`
  - Identical to the `state.pageIndex` option above
- `pageCount: Int`
  - **Required if `manualPagination` is set to `true`**
  - If `manualPagination` is `true`, then this value used to determine the amount of pages available. This amount is then used to materialize the `pageOptions` and also compute the `canNextPage` values on the table instance.
- `manualPagination: Bool`
  - Enables pagination functionality, but does not automatically perform row pagination.
  - Turn this on if you wish to implement your own pagination outside of the table (eg. server-side pagination or any other manual pagination technique)
- `disablePageResetOnDataChange`
  - Defaults to `false`
  - Normally, any changes detected to `rows`, `state.filters`, `state.groupBy`, or `state.sortBy` will trigger the `pageIndex` to be reset to `0`
  - If set to `true`, the `pageIndex` will not be automatically set to `0` when these dependencies change.
- `paginateExpandedRows: Bool`
  - Optional
  - Only applies when using the `useExpanded` plugin hook simultaneously
  - Defaults to `true`
  - If set to `true`, expanded rows are paginated along with normal rows. This results in stable page sizes across every page.
  - If set to `false`, expanded rows will be spliced in after pagination. This means that the total number of rows in a page can potentially be larger than the page size, depending on how many subrows are expanded.

### Instance Properties

The following values are provided to the table `instance`:

- `page: Array<row>`
  - An array of rows for the **current** page, determined by the current `pageIndex` value.
- `pageCount: Int`
  - If `manualPagination` is set to `false`, this is the total amount of pages available in the table based on the current `pageSize` value
  - if `manualPagination` is set to `true`, this is merely the same `pageCount` option that was passed in the table options.
- `pageOptions: Array<Int>`
  - An array of zero-based index integers corresponding to available pages in the table.
  - This can be useful for generating things like select interfaces for the user to select a page from a list, instead of manually paginating to the desired page.
- `canPreviousPage: Bool`
  - If there are pages and the current `pageIndex` is greater than `0`, this will be `true`
- `canNextPage:`
  - If there are pages and the current `pageIndex` is less than `pageCount`, this will be `true`
- `gotoPage: Function(pageIndex)`
  - This function, when called with a valid `pageIndex`, will set `pageIndex` to that value.
  - If the aginateassed index is outside of the valid `pageIndex` range, then this function will do nothing.
- `previousPage: Function`
  - This function decreases `state.pageIndex` by one.
  - If there are no pages or `canPreviousPage` is false, this function will do nothing.
- `nextPage: Function`
  - This function increases `state.pageIndex` by one.
  - If there are no pages or `canNextPage` is false, this function will do nothing.
- `setPageSize: Function(pageSize)`
  - This function sets `state.pageSize` to the new value.
  - As a result of a pageSize change, a new `state.pageIndex` is also calculated. It is calculated via `Math.floor(currentTopRowIndex / newPageSize)`
- `pageIndex: Int`
  - This is the resolved `state.pageIndex` value.
- `pageSize: Int`
  - This is the resolved `state.pageSize` value.

### Example

- Basic Pagination
  - [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/pagination)
  - [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/pagination)
- Controlled Pagination
  - [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/pagination)
  - [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/pagination)

# `useTokenPagination (Coming Soon)`

- Plugin Hook
- Optional

`useTokenPagination` is the hook that **aids in implementing row pagination using tokens**. It is useful for server-side pagination implementations that use **tokens** instead of page index. For more information on pagination, see Pagination

> Documentation Coming Soon...

# `useRowSelect`

- Plugin Hook
- Optional

`useRowSelect` is the hook that implements **basic row selection**. For more information on row selection, see Row Selection

### Table Options

The following options are supported via the main options object passed to `useTable(options)`

- `state.selectedRowPaths: Array<RowPathKey>`
  - Optional
  - Defaults to `[]`
  - If a row's path key (eg. a row path of `[1, 3, 2]` would have a path key of `1.3.2`) is found in this array, it will have a selected state.
- `initialState.selectedRowPaths`
  - Identical to the `state.selectedRowPaths` option above
- `manualRowSelectedKey: String`
  - Optional
  - Defaults to `isSelected`
  - If this key is found on the **original** data row, and it is true, this row will be manually selected

### Instance Properties

The following values are provided to the table `instance`:

- `toggleRowSelected: Function(rowPath: String, ?set: Bool) => void`
  - Use this function to toggle a row's selected state.
  - Optionally pass `true` or `false` to set it to that state
- `toggleRowSelectedAll: Function(?set: Bool) => void`
  - Use this function to toggle all rows as select or not
  - Optionally pass `true` or `false` to set all rows to that state
- `getToggleAllRowsSelectedProps: Function(props) => props`
  - Use this function to get the props needed for a **select all checkbox**.
  - Props:
    - `onChange: Function()`
    - `style.cursor: 'pointer'`
    - `checked: Bool`
    - `title: 'Toggle All Rows Selected'`
- `isAllRowsSelected: Bool`
  - Will be `true` if all rows are selected.
  - If at least one row is not selected, will be `false`
- `selectedFlatRows: Array<Row>`
  - The flat array of rows that are currently selected

### Row Properties

The following additional properties are available on every **prepared** `row` object returned by the table instance.

- `isSelected: Bool`
  - Will be `true` if the row is currently selected
- `toggleRowSelected: Function(?set)`
  - Use this function to toggle this row's selected state.
  - Optionally pass `true` or `false` to set it to that state

### Example

- [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/row-selection)
- [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/row-selection)

# `useRowState`

- Plugin Hook
- Optional

`useRowState` is a plugin hook that implements **basic state management for _prepared_ rows and their cells**.

### Table Options

The following options are supported via the main options object passed to `useTable(options)`

- `state.rowState: Object<RowPathKey:Object<any, cellState: {columnID: Object}>>`
  - Optional
  - Defaults to `{}`
  - If a row's path key (eg. a row path of `[1, 3, 2]` would have a path key of `1.3.2`) is found in this array, it will have the state of the value corresponding to that key.
  - Individual row states can contain anything, but they also contain a `cellState` key, which provides cell-level state based on column ID's to every
    **prepared** cell in the table.
- `initialState.rowState`
  - Identical to the `state.rowState` option above
- `initialRowStateAccessor: Function`
  - Optional
  - This function may optionally return the initial state for a row.
  - If this function is defined, it will be passed a `Row` object, from which you can return a value to use as the initial state, eg. `row => row.original.initialState`

### Instance Properties

The following values are provided to the table `instance`:

- `setRowState: Function(rowPath: Array<string>, updater: Function | Any) => void`
  - Use this function to programmatically update the state of a row.
  - `updater` can be a function or value. If a `function` is passed, it will receive the current value and expect a new one to be returned.
- `setCellState: Function(rowPath: Array<string>, columnID: String, updater: Function | Any) => void`
  - Use this function to programmatically update the cell of a row.
  - `updater` can be a function or value. If a `function` is passed, it will receive the current value and expect a new one to be returned.

### Row Properties

The following additional properties are available on every **prepared** `row` object returned by the table instance.

- `state: Object`
  - This is the state object for each row, pre-mapped to the row from the table state's `rowState` object via `rowState[row.path.join('.')]`
  - May also contain a `cellState` key/value pair, which is used to provide individual cell states to this row's cells
- `setState: Function(updater: Function | any)`
  - Use this function to programmatically update the state of a row.
  - `updater` can be a function or value. If a `function` is passed, it will receive the current value and expect a new one to be returned.

### Cell Properties

The following additional properties are available on every `Cell` object returned in an array of `cells` on every row object.

- `state: Object`
  - This is the state object for each cell, pre-mapped to the cell from the table state's `rowState` object via `rowState[row.path.join('.')].cellState[columnID]`
- `setState: Function(updater: Function | any)`
  - Use this function to programmatically update the state of a cell.
  - `updater` can be a function or value. If a `function` is passed, it will receive the current value and expect a new one to be returned.

# `useBlocklayout`

- Plugin Hook
- Optional

`useBlocklayout` is a plugin hook that adds support for headers and cells to be rendered as `inline-block` `div`s (or other non-table elements) with explicit `width`. Similar to the `useAbsoluteLayout` hook, this becomes useful if and when you need to virtualize rows and cells for performance.

**NOTE:** Although no additional options are needed for this plugin to work, the core column options `width`, `minWidth` and `maxWidth` are used to calculate column and cell widths and must be set. [See Column Options](#column-options) for more information on these options.

### Row Properties

- `getRowProps`
  - **Usage Required**
  - This core prop getter is required to to enable absolute layout for rows

### Cell Properties

- `getCellProps`
  - **Usage Required**
  - This core prop getter is required to to enable absolute layout for rows cells

### Header Properties

- `getHeaderProps`
  - **Usage Required**
  - This core prop getter is required to to enable absolute layout for headers

### Example

- [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/block-layout)
- [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/block-layout)

# `useAbsoluteLayout`

- Plugin Hook
- Optional

`useAbsoluteLayout` is a plugin hook that adds support for headers and cells to be rendered as absolutely positioned `div`s (or other non-table elements) with explicit `width`. Similar to the `useBlockLayout` hook, this becomes useful if and when you need to virtualize rows and cells for performance.

**NOTE:** Although no additional options are needed for this plugin to work, the core column options `width`, `minWidth` and `maxWidth` are used to calculate column and cell widths and must be set. [See Column Options](#column-options) for more information on these options.

### Instance Properties

- `getTableBodyProps`
  - **Usage Required**
  - This core prop getter is required to to enable absolute layout for the table body

### Row Properties

- `getRowProps`
  - **Usage Required**
  - This core prop getter is required to to enable absolute layout for rows

### Cell Properties

- `getCellProps`
  - **Usage Required**
  - This core prop getter is required to to enable absolute layout for rows cells

### Header Properties

- `getHeaderProps`
  - **Usage Required**
  - This core prop getter is required to to enable absolute layout for headers

### Example

- [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/absolute-layout)
- [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/absolute-layout)

# `useResizeColumns`

- Plugin Hook
- Optional

`useResizeColumns` is a plugin hook that adds support for resizing headers and cells when using non-table elements for layout eg. the `useBlockLayout` and `useAbsoluteLayout` hooks. It even supports resizing column groups!

### Table Options

- `disableResizing: Bool`
  - Defaults to `false`
  - When set to `true`, resizing is disabled across the entire table

### Column Options

The core column options `width`, `minWidth` and `maxWidth` are used to calculate column and cell widths and must be set. [See Column Options](#column-options) for more information on these options.

- `disableResizing: Bool`
  - Defaults to `false`
  - When set to `true`, resizing is disabled for this column

### Header Properties

- `getResizerProps`
  - **Usage Required**
  - This core prop getter is required to to enable absolute layout for headers
- `canResize: Bool`
  - Will be `true` if this column can be resized
- `isResizing: Bool`
  - Will be `true` if this column is currently being resized

### Example

- [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/column-resizing)
- [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/column-resizing)

# `useColumnOrder`

- Plugin Hook
- Optional

`useColumnOrder` is a plugin hook that implements **basic column reordering**. As columns are reordered, their header groups are reverse-engineered so as to never have orphaned header groups.

### Table Options

The following options are supported via the main options object passed to `useTable(options)`

- `state.columnOrder: Array<ColumnID>`
  - Optional
  - Defaults to `[]`
  - Any column ID's not represented in this array will be naturally ordered based on their position in the original table's `column` structure
- `initialState.columnOrder`
  - Identical to the `state.columnOrder` option above

### Instance Properties

The following values are provided to the table `instance`:

- `setColumnOrder: Function(updater: Function | Array<ColumnID>) => void`

  - Use this function to programmatically update the columnOrder.
  - `updater` can be a function or value. If a `function` is passed, it will receive the current value and expect a new one to be returned.

- [Source](https://github.com/tannerlinsley/react-table/tree/master/examples/column-ordering)
- [Open in CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/column-ordering)
