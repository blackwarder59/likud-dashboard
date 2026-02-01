import { useState, useEffect } from 'react'
import './App.css'
import EditModal from './components/EditModal'

const SHEET_ID = '1oINu6aCW38HJ4hI5ZiKf8C83zuBWf4I6GRGs6z9yfNc'
const RANGE = 'Sheet1!A1:J202'  // 10 columns: סניף through תאריך עדכון

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [editingRow, setEditingRow] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&range=${RANGE}`
      const response = await fetch(url)
      const text = await response.text()
      const json = JSON.parse(text.substring(47, text.length - 2))
      
      // Extract headers from cols
      const headers = json.table.cols.map(col => col.label || '')
      
      // Extract data rows
      const dataRows = json.table.rows.map(row => 
        row.c.map(cell => cell ? cell.v : '')
      )
      
      // Combine: [headers, ...dataRows]
      const allRows = [headers, ...dataRows]
      
      console.log('Headers:', headers)
      console.log('First 2 data rows:', dataRows.slice(0, 2))
      setData(allRows)
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError('שגיאה בטעינת הנתונים. ודא שהקובץ ציבורי.')
      setLoading(false)
    }
  }

  const handleSort = (columnIndex) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnIndex)
      setSortDirection('asc')
    }
  }

  const getRowStatus = (row) => {
    // Check if has manual votes
    const manualVotes = row[7] // קולות ידניים
    if (manualVotes && manualVotes !== '-') {
      return 'נתונים ידניים ✏️'
    }
    return row[6] // Original status
  }

  const getDisplayVotes = (row) => {
    // Use manual votes if available, otherwise use regular votes
    const manualVotes = row[7]
    if (manualVotes && manualVotes !== '-') {
      return manualVotes
    }
    return row[3] || '-'
  }

  const handleEdit = (row) => {
    setEditingRow(row)
  }

  const handleCloseModal = () => {
    setEditingRow(null)
  }

  const handleSaveSuccess = () => {
    // Refresh data after successful save
    fetchData()
    setEditingRow(null)
  }

  const filteredData = () => {
    if (!data.length) return []
    
    const [headers, ...rows] = data
    let filtered = rows.map((row, idx) => ({ row, originalIndex: idx }))

    // Filter by status
    if (filter === 'with-data') {
      filtered = filtered.filter(({ row }) => {
        const status = getRowStatus(row)
        return status === 'יש נתונים' || status.includes('ידניים')
      })
    } else if (filter === 'without-data') {
      filtered = filtered.filter(({ row }) => {
        const status = getRowStatus(row)
        return status === 'אין נתונים'
      })
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(({ row }) =>
        row.some(cell => 
          String(cell).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Sort
    if (sortColumn !== null) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a.row[sortColumn]
        let bVal = b.row[sortColumn]

        // Handle numeric columns (קולות)
        if (sortColumn === 3) {
          aVal = aVal === '-' ? 0 : parseInt(aVal) || 0
          bVal = bVal === '-' ? 0 : parseInt(bVal) || 0
        }

        // String comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal, 'he')
            : bVal.localeCompare(aVal, 'he')
        }

        // Numeric comparison
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      })
    }

    return filtered
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>טוען נתונים...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <h2>❌ שגיאה</h2>
        <p>{error}</p>
        <button onClick={fetchData}>נסה שוב</button>
      </div>
    )
  }

  const headers = data[0] || []
  const filteredRows = filteredData()
  const allRows = data.slice(1) // Skip headers
  
  // Count by status including manual
  const withData = allRows.filter(r => {
    const status = getRowStatus(r)
    return status === 'יש נתונים' || status.includes('ידניים')
  }).length
  const withoutData = allRows.filter(r => getRowStatus(r) === 'אין נתונים').length

  const getSortIcon = (columnIndex) => {
    if (sortColumn !== columnIndex) return ' ⇅'
    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="app" dir="rtl">
      <header className="header">
        <h1>🗳️ תוצאות מועצות סניפים - ליכוד 2026</h1>
        <p className="subtitle">
          סה"כ {allRows.length} רשימות | {withData} עם תוצאות | {withoutData} ללא תוצאות
        </p>
      </header>

      <div className="controls">
        <div className="filters">
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'active' : ''}
          >
            הכל ({allRows.length})
          </button>
          <button
            onClick={() => setFilter('with-data')}
            className={filter === 'with-data' ? 'active green' : ''}
          >
            עם תוצאות ({withData})
          </button>
          <button
            onClick={() => setFilter('without-data')}
            className={filter === 'without-data' ? 'active yellow' : ''}
          >
            ללא תוצאות ({withoutData})
          </button>
        </div>

        <div className="actions">
          <input
            type="text"
            placeholder="חפש סניף או שם..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search"
          />
          <a
            href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-sheets"
          >
            📊 Google Sheets
          </a>
          <button onClick={fetchData} className="btn-refresh">
            🔄 רענן
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {headers.slice(0, 7).map((header, i) => (
                <th 
                  key={i}
                  onClick={() => handleSort(i)}
                  className="sortable"
                  title={`מיין לפי ${header}`}
                >
                  {header}{getSortIcon(i)}
                </th>
              ))}
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(({ row, originalIndex }, i) => {
              const status = getRowStatus(row)
              const hasManualData = status.includes('ידניים')
              const rowClass = status === 'יש נתונים' || hasManualData ? 'has-data' : 'no-data'
              const manualClass = hasManualData ? 'manual-data' : ''
              
              return (
                <tr key={i} className={`${rowClass} ${manualClass}`}>
                  <td>{row[0] || '-'}</td>
                  <td>{row[1] || '-'}</td>
                  <td>{row[2] || '-'}</td>
                  <td className={hasManualData ? 'manual-highlight' : ''}>
                    {getDisplayVotes(row)}
                    {hasManualData && <span className="manual-badge">ידני</span>}
                  </td>
                  <td>{row[4] || '-'}</td>
                  <td>{row[5] || '-'}</td>
                  <td className={hasManualData ? 'manual-highlight' : ''}>
                    {status}
                  </td>
                  <td>
                    {status === 'אין נתונים' && (
                      <button
                        onClick={() => handleEdit(row)}
                        className="btn-edit"
                        title="הוסף נתונים ידניים"
                      >
                        ✏️ ערוך
                      </button>
                    )}
                    {hasManualData && (
                      <button
                        onClick={() => handleEdit(row)}
                        className="btn-edit-small"
                        title="ערוך נתונים"
                      >
                        ✏️
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredRows.length === 0 && (
          <div className="empty">
            <p>אין נתונים להצגה</p>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>נתונים מעודכנים מ-Google Sheets | לחץ "רענן" לעדכון אחרון</p>
        <p className="manual-info">💡 לחץ "ערוך" ליד סניף ללא נתונים כדי להוסיף מידע ידנית</p>
      </footer>

      {editingRow && (
        <EditModal
          row={editingRow}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  )
}

export default App
