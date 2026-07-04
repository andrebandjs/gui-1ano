const SPREADSHEET_ID = "18r48bY5YF7JHnwZ3ez5vS88WkObS9kWDdHcNTDjCLCI";

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Respostas");
  const data = JSON.parse(e.postData.contents);

  const submittedAt = data.submittedAt || new Date().toISOString();
  const guests = data.guests || [];
  const source = data.source || "convite-guilherme-1-ano";

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Aba Respostas não encontrada" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  guests.forEach(function(guest) {
    sheet.appendRow([
      submittedAt,
      guest.name || "",
      guest.age || "",
      guest.status || "",
      source
    ]);
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
