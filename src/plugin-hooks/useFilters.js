import React from 'react'

import {
  actions,
  getFirstDefined,
  isFunction,
  useMountedLayoutEffect,
  functionalUpdate,
  useGetLatest,
} from '../utils'
import * as filterTypes from '../filterTypes'

// Actions
actions.resetFilters = 'resetFilters'
actions.setFilter = 'setFilter'
actions.setAllFilters = 'setAllFilters'

export const useFilters = hooks => {
  hooks.stateReducers.push(reducer)
  hooks.useInstance.push(useInstance)
}

useFilters.pluginName = 'useFilters'

function reducer(state, action, previousState, instanceRef) {
  if (action.type === actions.init) {
    return {
      filters: {},
      ...state,
    }
  }

  if (action.type === actions.resetFilters) {
    return {
      ...state,
      filters: {},
    }
  }

  if (action.type === actions.setFilter) {
    const { columnId, filterValue } = action
    const { flatColumns, userFilterTypes } = instanceRef.current
    const column = flatColumns.find(d => d.id === columnId)

    if (!column) {
      throw new Error(
        `React-Table: Could not find a column with id: ${columnId}`
      )
    }

    const filterMethod = getFilterMethod(
      column.filter,
      userFilterTypes || {},
      filterTypes
    )

    const newFilter = functionalUpdate(filterValue, state.filters[columnId])

    //
    if (shouldAutoRemove(filterMethod.autoRemove, newFilter)) {
      const { [columnId]: remove, ...newFilters } = state.filters

      return {
        ...state,
        filters: newFilters,
      }
    }

    return {
      ...state,
      filters: {
        ...state.filters,
        [columnId]: newFilter,
      },
    }
  }

  if (action.type === actions.setAllFilters) {
    const { filters } = action
    const { flatColumns, filterTypes: userFilterTypes } = instanceRef.current
    const newFilters = functionalUpdate(filters, state.filters)

    // Filter out undefined values
    Object.keys(newFilters).forEach(id => {
      const newFilter = newFilters[id]
      const column = flatColumns.find(d => d.id === id)
      const filterMethod = getFilterMethod(
        column.filter,
        userFilterTypes || {},
        filterTypes
      )

      if (shouldAutoRemove(filterMethod.autoRemove, newFilter)) {
        delete newFilters[id]
      }
    })

    return {
      ...state,
      filters: newFilters,
    }
  }
}

function useInstance(instance) {
  const {
    data,
    rows,
    flatRows,
    flatColumns,
    filterTypes: userFilterTypes,
    manualFilters,
    defaultCanFilter = false,
    disableFilters,
    state: { filters },
    dispatch,
    autoResetFilters = true,
  } = instance

  const preFilteredRows = rows
  const preFilteredFlatRows = flatRows

  const setFilter = (columnId, filterValue) => {
    dispatch({ type: actions.setFilter, columnId, filterValue })
  }

  const setAllFilters = filters => {
    dispatch({
      type: actions.setAllFilters,
      filters,
    })
  }

  flatColumns.forEach(column => {
    const {
      id,
      accessor,
      defaultCanFilter: columnDefaultCanFilter,
      disableFilters: columnDisableFilters,
    } = column

    // Determine if a column is filterable
    column.canFilter = accessor
      ? getFirstDefined(
          columnDisableFilters === true ? false : undefined,
          disableFilters === true ? false : undefined,
          true
        )
      : getFirstDefined(columnDefaultCanFilter, defaultCanFilter, false)

    // Provide the column a way of updating the filter value
    column.setFilter = val => setFilter(column.id, val)

    // Provide the current filter value to the column for
    // convenience
    column.filterValue = filters[id]
  })

  // TODO: Create a filter cache for incremental high speed multi-filtering
  // This gets pretty complicated pretty fast, since you have to maintain a
  // cache for each row group (top-level rows, and each row's recursive subrows)
  // This would make multi-filtering a lot faster though. Too far?

  const { filteredRows, filteredFlatRows } = React.useMemo(() => {
    if (manualFilters || !Object.keys(filters).length) {
      return {
        filteredRows: rows,
        filteredFlatRows: flatRows,
      }
    }

    const filteredFlatRows = []

    // Filters top level and nested rows
    const filterRows = (rows, depth = 0) => {
      let filteredRows = rows

      filteredRows = Object.entries(filters).reduce(
        (filteredSoFar, [columnId, filterValue]) => {
          // Find the filters column
          const column = flatColumns.find(d => d.id === columnId)

          if (!column) {
            return filteredSoFar
          }

          if (depth === 0) {
            column.preFilteredRows = filteredSoFar
          }

          const filterMethod = getFilterMethod(
            column.filter,
            userFilterTypes || {},
            filterTypes
          )

          if (!filterMethod) {
            console.warn(
              `Could not find a valid 'column.filter' for column with the ID: ${column.id}.`
            )
            return filteredSoFar
          }

          // Pass the rows, id, filterValue and column to the filterMethod
          // to get the filtered rows back
          column.filteredRows = filterMethod(
            filteredSoFar,
            columnId,
            filterValue,
            column
          )

          return column.filteredRows
        },
        rows
      )

      // Apply the filter to any subRows
      // We technically could do this recursively in the above loop,
      // but that would severely hinder the API for the user, since they
      // would be required to do that recursion in some scenarios
      filteredRows = filteredRows.map(row => {
        filteredFlatRows.push(row)
        if (!row.subRows) {
          return row
        }
        return {
          ...row,
          subRows:
            row.subRows && row.subRows.length > 0
              ? filterRows(row.subRows, depth + 1)
              : row.subRows,
        }
      })

      return filteredRows
    }

    return {
      filteredRows: filterRows(rows),
      filteredFlatRows,
    }
  }, [manualFilters, filters, rows, flatRows, flatColumns, userFilterTypes])

  React.useMemo(() => {
    // Now that each filtered column has it's partially filtered rows,
    // lets assign the final filtered rows to all of the other columns
    const nonFilteredColumns = flatColumns.filter(
      column => !Object.keys(filters).includes(column.id)
    )

    // This essentially enables faceted filter options to be built easily
    // using every column's preFilteredRows value
    nonFilteredColumns.forEach(column => {
      column.preFilteredRows = filteredRows
      column.filteredRows = filteredRows
    })
  }, [filteredRows, filters, flatColumns])

  const getAutoResetFilters = useGetLatest(autoResetFilters)

  useMountedLayoutEffect(() => {
    if (getAutoResetFilters()) {
      dispatch({ type: actions.resetFilters })
    }
  }, [dispatch, manualFilters ? null : data])

  return {
    ...instance,
    setFilter,
    setAllFilters,
    preFilteredRows,
    preFilteredFlatRows,
    rows: filteredRows,
    flatRows: filteredFlatRows,
  }
}

function shouldAutoRemove(autoRemove, value) {
  return autoRemove ? autoRemove(value) : typeof value === 'undefined'
}

function getFilterMethod(filter, userFilterTypes, filterTypes) {
  return (
    isFunction(filter) ||
    userFilterTypes[filter] ||
    filterTypes[filter] ||
    filterTypes.text
  )
}
