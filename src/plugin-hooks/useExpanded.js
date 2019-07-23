import { useMemo } from 'react'
import PropTypes from 'prop-types'

import { getBy, getFirstDefined, setBy } from '../utils'
import { addActions, actions } from '../actions'
import { defaultState } from '../hooks/useTableState'

defaultState.expanded = {}

addActions('toggleExpanded', 'useExpanded')

const propTypes = {
  manualExpandedKey: PropTypes.string,
  paginateSubRows: PropTypes.bool,
}

export const useExpanded = props => {
  PropTypes.checkPropTypes(propTypes, props, 'property', 'useExpanded')

  const {
    debug,
    rows,
    manualExpandedKey = 'expanded',
    hooks,
    state: [{ expanded }, setState],
    paginateSubRows = true,
  } = props

  const toggleExpandedByPath = (path, set) => {
    return setState(old => {
      const { expanded } = old
      const existing = getBy(expanded, path)
      set = getFirstDefined(set, !existing)
      return {
        ...old,
        expanded: setBy(expanded, path, set),
      }
    }, actions.toggleExpanded)
  }

  hooks.row.push(row => {
    const { path } = row
    row.toggleExpanded = set => toggleExpandedByPath(path, set)
    return row
  })

  const expandedRows = useMemo(() => {
    if (debug) console.info('getExpandedRows')

    const expandedRows = []

    // Here we do some mutation, but it's the last stage in the
    // immutable process so this is safe
    const handleRow = (row, depth = 0, parentPath = []) => {
      // Compute some final state for the row
      const path = [...parentPath, row.index]

      row.path = path
      row.depth = depth

      row.isExpanded =
        (row.original && row.original[manualExpandedKey]) ||
        getBy(expanded, path)

      if (paginateSubRows || (!paginateSubRows && row.depth === 0)) {
        expandedRows.push(row)
      }

      if (row.isExpanded && row.subRows && row.subRows.length) {
        row.subRows.forEach((row, i) => handleRow(row, depth + 1, path))
      }

      return row
    }

    rows.forEach(row => handleRow(row))

    return expandedRows
  }, [debug, rows, manualExpandedKey, expanded, paginateSubRows])

  const expandedDepth = findExpandedDepth(expanded)

  return {
    ...props,
    toggleExpandedByPath,
    expandedDepth,
    rows: expandedRows,
  }
}

function findExpandedDepth(obj, depth = 1) {
  return Object.values(obj).reduce((prev, curr) => {
    if (typeof curr === 'object') {
      return Math.max(prev, findExpandedDepth(curr, depth + 1))
    }
    return depth
  }, 0)
}
