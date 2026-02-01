// Google Apps Script - Likud Dashboard Data Entry
// Deploy this as a Web App to allow the dashboard to save manual data

const SHEET_ID = '1oINu6aCW38HJ4hI5ZiKf8C83zuBWf4I6GRGs6z9yfNc';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0]; // First sheet
    
    // Find the row by סניף and ראש רשימה
    const branchName = data.branch;
    const listLeader = data.listLeader;
    
    // Get all data
    const allData = sheet.getDataRange().getValues();
    
    // Find matching row (skip header)
    let rowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === branchName && allData[i][1] === listLeader) {
        rowIndex = i + 1; // +1 because getValues is 0-based, but setValues needs 1-based
        break;
      }
    }
    
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'לא נמצאה שורה מתאימה'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update the row
    // H = קולות ידניים (column 8)
    // I = מקור נתונים (column 9)
    // J = תאריך עדכון (column 10)
    
    const today = new Date().toLocaleDateString('he-IL');
    
    sheet.getRange(rowIndex, 8).setValue(data.votes); // Column H
    sheet.getRange(rowIndex, 9).setValue(data.source || 'ידני'); // Column I
    sheet.getRange(rowIndex, 10).setValue(data.date || today); // Column J
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'הנתונים נשמרו בהצלחה!',
      row: rowIndex
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Apps Script is running. Use POST to submit data.');
}
