import { useState, useEffect } from 'react'
import './App.css'

const SHEET_ID = '1oINu6aCW38HJ4hI5ZiKf8C83zuBWf4I6GRGs6z9yfNc'
const RANGE = 'Sheet1!A1:G202'  // Only 7 columns: סניף through סטטוס

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

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
      const rows = json.table.rows.map(row => 
        row.c.map(cell => cell ? cell.v : '')
      )
      
      console.log('First 3 rows:', rows.slice(0, 3))
      setData(rows)
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

  const filteredData = () => {
    if (!data.length) return []
    
    const [headers, ...rows] = data
    let filtered = rows

    // Filter by status
    if (filter === 'with-data') {
      filtered = filtered.filter(row => row[6] === 'יש נתונים')
    } else if (filter === 'without-data') {
      filtered = filtered.filter(row => row[6] === 'אין נתונים')
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        row.some(cell => 
          String(cell).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Sort
    if (sortColumn !== null) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortColumn]
        let bVal = b[sortColumn]

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
  const rows = filteredData()
  const allRows = data.slice(1) // Skip headers
  const withData = allRows.filter(r => r[6] === 'יש נתונים').length
  const withoutData = allRows.filter(r => r[6] === 'אין נתונים').length

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
              {headers.map((header, i) => (
                <th 
                  key={i}
                  onClick={() => handleSort(i)}
                  className="sortable"
                  title={`מיין לפי ${header}`}
                >
                  {header}{getSortIcon(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const status = row[6]
              const rowClass = status === 'יש נתונים' ? 'has-data' : 'no-data'
              
              return (
                <tr key={i} className={rowClass}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell || '-'}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="empty">
            <p>אין נתונים להצגה</p>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>נתונים מעודכנים מ-Google Sheets | לחץ "רענן" לעדכון אחרון</p>
      </footer>
    </div>
  )
}

export default App
