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
- `getResetExpandedDeps: Function(instance) => [...useEffectDependencies]`
  - Optional
  - Defaults to resetting the `expanded` state to `[]` when the dependencies below change
    - ```js
      const getResetExpandedDeps = ({ data }) => [data]
      ```
  - If set, the dependencies returned from this function will be used to determine when the effect to reset the `expanded` state is fired.
  - To disable, set to `false`
  - For more information see the FAQ ["How do I stop my table state from automatically resetting when my data changes?"](./faq#how-do-i-stop-my-table-state-from-automatically-resetting-when-my-data-changes)

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
