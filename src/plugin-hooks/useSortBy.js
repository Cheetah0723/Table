import React from 'react'
import PropTypes from 'prop-types'

import { ensurePluginOrder, defaultColumn } from '../utils'
import { addActions, actions } from '../actions'
import { defaultState } from '../hooks/useTable'
import * as sortTypes from '../sortTypes'
import {
  mergeProps,
  applyPropHooks,
  getFirstDefined,
  defaultOrderByFn,
  isFunction,
} from '../utils'

defaultState.sortBy = []
defaultColumn.sortType = 'alphanumeric'
defaultColumn.sortDescFirst = false

addActions('sortByChange')

const propTypes = {
  // General
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      sortType: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      sortDescFirst: PropTypes.bool,
      disableSorting: PropTypes.bool,
    })
  ),
  orderByFn: PropTypes.func,
  sortTypes: PropTypes.object,
  manualSorting: PropTypes.bool,
  disableSorting: PropTypes.bool,
  disableMultiSort: PropTypes.bool,
  isMultiSortEvent: PropTypes.func,
  maxMultiSortColCount: PropTypes.number,
  disableSortRemove: PropTypes.bool,
  disableMultiRemove: PropTypes.bool,
}

export const useSortBy = hooks => {
  hooks.useMain.push(useMain)
}

useSortBy.pluginName = 'useSortBy'

function useMain(instance) {
  PropTypes.checkPropTypes(propTypes, instance, 'property', 'useSortBy')

  const {
    debug,
    rows,
    flatColumns,
    orderByFn = defaultOrderByFn,
    sortTypes: userSortTypes,
    manualSorting,
    disableSorting,
    disableSortRemove,
    disableMultiRemove,
    disableMultiSort,
    isMultiSortEvent = e => e.shiftKey,
    maxMultiSortColCount = Number.MAX_SAFE_INTEGER,
    flatHeaders,
    hooks,
    state: { sortBy },
    setState,
    plugins,
  } = instance

  ensurePluginOrder(plugins, ['useFilters'], 'useSortBy', [])
  // Add custom hooks
  hooks.getSortByToggleProps = []

  // Updates sorting based on a columnID, desc flag and multi flag
  const toggleSortBy = (columnID, desc, multi) => {
    return setState(old => {
      const { sortBy } = old

      // Find the column for this columnID
      const column = flatColumns.find(d => d.id === columnID)
      const { sortDescFirst } = column

      // Find any existing sortBy for this column
      const existingSortBy = sortBy.find(d => d.id === columnID)
      const existingIndex = sortBy.findIndex(d => d.id === columnID)
      const hasDescDefined = typeof desc !== 'undefined' && desc !== null

      let newSortBy = []

      // What should we do with this sort action?
      let action

      if (!disableMultiSort && multi) {
        if (existingSortBy) {
          action = 'toggle'
        } else {
          action = 'add'
        }
      } else {
        // Normal mode
        if (existingIndex !== sortBy.length - 1) {
          action = 'replace'
        } else if (existingSortBy) {
          action = 'toggle'
        } else {
          action = 'replace'
        }
      }

      // Handle toggle states that will remove the sortBy
      if (
        action === 'toggle' && // Must be toggling
        !disableSortRemove && // If disableSortRemove, disable in general
        !hasDescDefined && // Must not be setting desc
        (multi ? !disableMultiRemove : true) && // If multi, don't allow if disableMultiRemove
        ((existingSortBy && // Finally, detect if it should indeed be removed
          (existingSortBy.desc && !sortDescFirst)) ||
          (!existingSortBy.desc && sortDescFirst))
      ) {
        action = 'remove'
      }

      if (action === 'replace') {
        newSortBy = [
          {
            id: columnID,
            desc: hasDescDefined ? desc : sortDescFirst,
          },
        ]
      } else if (action === 'add') {
        newSortBy = [
          ...sortBy,
          {
            id: columnID,
            desc: hasDescDefined ? desc : sortDescFirst,
          },
        ]
        // Take latest n columns
        newSortBy.splice(0, newSortBy.length - maxMultiSortColCount)
      } else if (action === 'toggle') {
        // This flips (or sets) the
        newSortBy = sortBy.map(d => {
          if (d.id === columnID) {
            return {
              ...d,
              desc: hasDescDefined ? desc : !existingSortBy.desc,
            }
          }
          return d
        })
      } else if (action === 'remove') {
        newSortBy = sortBy.filter(d => d.id !== columnID)
      }

      return {
        ...old,
        sortBy: newSortBy,
      }
    }, actions.sortByChange)
  }

  // Add the getSortByToggleProps method to columns and headers
  flatHeaders.forEach(column => {
    const { accessor, disableSorting: columnDisableSorting, id } = column

    const canSort = accessor
      ? getFirstDefined(
          columnDisableSorting === true ? false : undefined,
          disableSorting === true ? false : undefined,
          true
        )
      : false

    column.canSort = canSort

    if (column.canSort) {
      column.toggleSortBy = (desc, multi) =>
        toggleSortBy(column.id, desc, multi)

      column.clearSorting = () => {
        return setState(old => {
          const { sortBy } = old
          const newSortBy = sortBy.filter(d => d.id !== column.id)
          return {
            ...old,
            sortBy: newSortBy,
          }
        }, actions.sortByChange)
      }
    }

    column.getSortByToggleProps = props => {
      return mergeProps(
        {
          onClick: canSort
            ? e => {
                e.persist()
                column.toggleSortBy(
                  undefined,
                  !instance.disableMultiSort && isMultiSortEvent(e)
                )
              }
            : undefined,
          style: {
            cursor: canSort ? 'pointer' : undefined,
          },
          title: 'Toggle SortBy',
        },
        applyPropHooks(instance.hooks.getSortByToggleProps, column, instance),
        props
      )
    }

    const columnSort = sortBy.find(d => d.id === id)
    column.isSorted = !!columnSort
    column.sortedIndex = sortBy.findIndex(d => d.id === id)
    column.isSortedDesc = column.isSorted ? columnSort.desc : undefined
  })

  const sortedRows = React.useMemo(() => {
    if (manualSorting || !sortBy.length) {
      return rows
    }
    if (process.env.NODE_ENV === 'development' && debug)
      console.time('getSortedRows')

    // Filter out sortBys that correspond to non existing columns
    const availableSortBy = sortBy.filter(sort =>
      flatColumns.find(col => col.id === sort.id)
    )

    const sortData = rows => {
      // Use the orderByFn to compose multiple sortBy's together.
      // This will also perform a stable sorting using the row index
      // if needed.
      const sortedData = orderByFn(
        rows,
        availableSortBy.map(sort => {
          // Support custom sorting methods for each column
          const column = flatColumns.find(d => d.id === sort.id)

          if (!column) {
            throw new Error(
              `React-Table: Could not find a column with id: ${sort.id} while sorting`
            )
          }

          const { sortType } = column

          // Look up sortBy functions in this order:
          // column function
          // column string lookup on user sortType
          // column string lookup on built-in sortType
          // default function
          // default string lookup on user sortType
          // default string lookup on built-in sortType
          const sortMethod =
            isFunction(sortType) ||
            (userSortTypes || {})[sortType] ||
            sortTypes[sortType]

          if (!sortMethod) {
            throw new Error(
              `React-Table: Could not find a valid sortType of '${sortType}' for column '${sort.id}'.`
            )
          }

          // Return the correct sortFn.
          // This function should always return in ascending order
          return (a, b) => sortMethod(a, b, sort.id)
        }),
        // Map the directions
        availableSortBy.map(sort => {
          // Detect and use the sortInverted option
          const column = flatColumns.find(d => d.id === sort.id)

          if (column && column.sortInverted) {
            return sort.desc
          }

          return !sort.desc
        })
      )

      // If there are sub-rows, sort them
      sortedData.forEach(row => {
        if (!row.subRows || row.subRows.length <= 1) {
          return
        }
        row.subRows = sortData(row.subRows)
      })

      return sortedData
    }

    if (process.env.NODE_ENV === 'development' && debug)
      console.timeEnd('getSortedRows')

    return sortData(rows)
  }, [
    manualSorting,
    sortBy,
    debug,
    rows,
    flatColumns,
    orderByFn,
    userSortTypes,
  ])

  return {
    ...instance,
    toggleSortBy,
    rows: sortedRows,
    preSortedRows: rows,
  }
}
