import { useState } from 'react'
import './EditModal.css'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzCowr7rOwW9QnZN5e2GFYgNJw345Ykj0-2kgY0QTbwpH5zC6r4kmqVX7lIilM24zmaQ/exec'

function EditModal({ row, onClose, onSuccess }) {
  const [votes, setVotes] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!votes || isNaN(votes)) {
      setError('נא להזין מספר קולות תקין')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch: row[0],
          listLeader: row[1],
          votes: parseInt(votes),
          source: source || 'ידני',
          date: new Date().toLocaleDateString('he-IL')
        })
      })

      // With no-cors we can't read the response, but if no error thrown = success
      setLoading(false)
      onSuccess()
      onClose()
      
    } catch (err) {
      console.error('Error:', err)
      setError('שגיאה בשמירה. נסה שוב.')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ הוספת נתונים ידנית</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>סניף</label>
            <input 
              type="text" 
              value={row[0]} 
              disabled 
              className="input-disabled"
            />
          </div>

          <div className="form-group">
            <label>ראש רשימה</label>
            <input 
              type="text" 
              value={row[1]} 
              disabled 
              className="input-disabled"
            />
          </div>

          <div className="form-group">
            <label>מספר קולות *</label>
            <input 
              type="number" 
              value={votes}
              onChange={(e) => setVotes(e.target.value)}
              placeholder="לדוגמה: 300"
              className="input-field"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>מקור המידע (אופציונלי)</label>
            <input 
              type="text" 
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="לדוגמה: פגישה עם ראש הסניף"
              className="input-field"
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="btn-cancel"
              disabled={loading}
            >
              ביטול
            </button>
            <button 
              type="submit"
              className="btn-save"
              disabled={loading}
            >
              {loading ? '💾 שומר...' : '💾 שמור'}
            </button>
          </div>
        </form>

        <div className="modal-footer">
          <small>הנתונים יישמרו ב-Google Sheets ויעודכנו אוטומטית</small>
        </div>
      </div>
    </div>
  )
}

export default EditModal
