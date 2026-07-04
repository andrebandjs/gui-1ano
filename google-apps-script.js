function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostas");
  const data = JSON.parse(e.postData.contents);

  const submittedAt = data.submittedAt || new Date().toISOString();
  const guests = data.guests || [];
  const source = data.source || "convite-guilherme-1-ano";

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
