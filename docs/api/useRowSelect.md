# `useRowSelect`

- Plugin Hook
- Optional

`useRowSelect` is the hook that implements **basic row selection**. For more information on row selection, see Row Selection

### Table Options

The following options are supported via the main options object passed to `useTable(options)`

- `state.selectedRowPaths: Set<RowPathKey>`
  - Optional
  - Defaults to `new Set()`
  - If a row's path key (eg. a row path of `[1, 3, 2]` would have a path key of `1.3.2`) is found in this array, it will have a selected state.
- `initialState.selectedRowPaths`
  - Identical to the `state.selectedRowPaths` option above
- `manualRowSelectedKey: String`
  - Optional
  - Defaults to `isSelected`
  - If this key is found on the **original** data row, and it is true, this row will be manually selected
- `getResetSelectedRowPathsDeps: Function(instance) => [...useEffectDependencies]`
  - Optional
  - Defaults to resetting the `expanded` state to `[]` when the dependencies below change
    - ```js
      const getResetSelectedRowPathsDeps = ({ rows }) => [rows]
      ```
  - If set, the dependencies returned from this function will be used to determine when the effect to reset the `selectedRowPaths` state is fired.
  - To disable, set to `false`
  - For more information see the FAQ ["How do I stop my table state from automatically resetting when my data changes?"](./faq#how-do-i-stop-my-table-state-from-automatically-resetting-when-my-data-changes)

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
