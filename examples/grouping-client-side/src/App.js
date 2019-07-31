import React from 'react'
import styled from 'styled-components'
import { useTable, useGroupBy, useExpanded } from 'react-table'

import makeData from './makeData'

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`

function Table({ columns, data }) {
  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
    state: [{ groupBy, expanded }],
  } = useTable(
    {
      columns,
      data,
    },
    useGroupBy,
    useExpanded // useGroupBy would be pretty useless without useExpanded ;)
  )

  // We don't want to render all of the rows for this example, so cap
  // it at 20 for this use case
  const firstPageRows = rows.slice(0, 100)

  return (
    <>
      <pre>
        <code>{JSON.stringify({ groupBy, expanded }, null, 2)}</code>
      </pre>
      <Legend />
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>
                  {column.canGroupBy ? (
                    // If the column can be grouped, let's add a toggle
                    <span {...column.getGroupByToggleProps()}>
                      {column.grouped ? '🛑 ' : '👊 '}
                    </span>
                  ) : null}
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {firstPageRows.map(
            (row, i) =>
              prepareRow(row) || (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return (
                      <td
                        // For educational purposes, let's color the
                        // cell depending on what type it is given
                        // from the useGroupBy hook
                        {...cell.getCellProps()}
                        style={{
                          background: cell.grouped
                            ? '#0aff0082'
                            : cell.aggregated
                            ? '#ffa50078'
                            : cell.repeatedValue
                            ? '#ff000042'
                            : 'white',
                        }}
                      >
                        {cell.grouped ? (
                          // If it's a grouped cell, add an expander and row count
                          <>
                            <span
                              style={{
                                cursor: 'pointer',
                              }}
                              onClick={() => row.toggleExpanded()}
                            >
                              {row.isExpanded ? '👇' : '👉'}
                            </span>{' '}
                            {cell.render('Cell')} ({row.subRows.length})
                          </>
                        ) : cell.aggregated ? (
                          // If the cell is aggregated, use the Aggregated
                          // renderer for cell
                          cell.render('Aggregated')
                        ) : cell.repeatedValue ? null : ( // For cells with repeated values, render null
                          // Otherwise, just render the regular cell
                          cell.render('Cell')
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
          )}
        </tbody>
      </table>
      <br />
      <div>Showing the first 100 results of {rows.length} rows</div>
    </>
  )
}

function Legend() {
  return (
    <div
      style={{
        padding: '0.5rem 0',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          background: '#0aff0082',
          padding: '0.5rem',
        }}
      >
        Grouped
      </span>{' '}
      <span
        style={{
          display: 'inline-block',
          background: '#ffa50078',
          padding: '0.5rem',
        }}
      >
        Aggregated
      </span>{' '}
      <span
        style={{
          display: 'inline-block',
          background: '#ff000042',
          padding: '0.5rem',
        }}
      >
        Repeated Value
      </span>
    </div>
  )
}

// This is a custom aggregator that
// takes in an array of values and
// returns the rounded median
function roundedMedian(values) {
  let min = values[0] || ''
  let max = values[0] || ''

  values.forEach(value => {
    min = Math.min(min, value)
    max = Math.max(max, value)
  })

  return Math.round((min + max) / 2)
}

function App() {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        columns: [
          {
            Header: 'First Name',
            accessor: 'firstName',
            // Use a two-stage aggregator here to first
            // count the total rows being aggregated,
            // then sum any of those counts if they are
            // aggregated further
            aggregate: ['sum', 'count'],
            Aggregated: ({ value }) => `${value} Names`,
          },
          {
            Header: 'Last Name',
            accessor: 'lastName',
            // Use another two-stage aggregator here to
            // first count the UNIQUE values from the rows
            // being aggregated, then sum those counts if
            // they are aggregated further
            aggregate: ['sum', 'uniqueCount'],
            Aggregated: ({ value }) => `${value} Unique Names`,
          },
        ],
      },
      {
        Header: 'Info',
        columns: [
          {
            Header: 'Age',
            accessor: 'age',
            // Aggregate the average age of visitors
            aggregate: 'average',
            Aggregated: ({ value }) => `${value} (avg)`,
          },
          {
            Header: 'Visits',
            accessor: 'visits',
            // Aggregate the sum of all visits
            aggregate: 'sum',
            Aggregated: ({ value }) => `${value} (total)`,
          },
          {
            Header: 'Status',
            accessor: 'status',
          },
          {
            Header: 'Profile Progress',
            accessor: 'progress',
            // Use our custom roundedMedian aggregator
            aggregate: roundedMedian,
            Aggregated: ({ value }) => `${value} (med)`,
          },
        ],
      },
    ],
    []
  )

  const data = React.useMemo(() => makeData(10000), [])

  return (
    <Styles>
      <Table columns={columns} data={data} />
    </Styles>
  )
}

export default App
