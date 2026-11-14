// Receives the backup files from the hours app and saves them in a folder in YOUR Google Drive.
// It runs under your own Google account; the app only knows this script's address.
const FOLDER = 'hours-backup';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const found = DriveApp.getFoldersByName(FOLDER);
    const folder = found.hasNext() ? found.next() : DriveApp.createFolder(FOLDER);
    const files = (data.files || []).slice(0, 10);
    files.forEach(function (f) {
      const name = String(f.name).replace(/[^\w.\-]/g, '_').slice(0, 60);
      const content = String(f.content).slice(0, 2000000);
      const existing = folder.getFilesByName(name);
      if (existing.hasNext()) existing.next().setContent(content);
      else folder.createFile(name, content, /\.csv$/.test(name) ? MimeType.CSV : MimeType.PLAIN_TEXT);
    });
    return reply({ ok: true, saved: files.length });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function doGet() {
  return reply({ ok: true, info: 'hours backup is ready' });
}

function reply(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
