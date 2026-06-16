/**
 * The Season — Proposal notifications (Accept / Questions)
 *
 * Receives a POST from /api/proposal-action (via Vercel) whenever a client
 * Accepts a proposal or submits Questions. Appends a row to the Google
 * Sheet log AND emails the team.
 *
 * SETUP
 *  1. Create a Google Sheet (sheets.new), name it "Proposal Activity".
 *     Copy its ID from the URL: .../spreadsheets/d/<SHEET_ID>/edit
 *  2. Extensions → Apps Script. Paste this whole file. Set SHEET_ID below.
 *  3. ⌘S to save. Run `testWrite` from the editor (function dropdown → Run),
 *     authorize when prompted. Confirm a TEST row appears, then delete it.
 *  4. Deploy → New deployment → Web app:
 *       Execute as: Me   ·   Who has access: Anyone
 *     Copy the Web App URL.
 *  5. In Vercel env vars, set:
 *       SHEETS_WEBHOOK = <the Web App URL>
 *       NOTIFY_EMAIL   = steven@theseason.nyc   (comma-separate for several)
 *     Redeploy.
 */

const SHEET_ID = '<paste-sheet-id-from-the-sheet-URL>';

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, method: 'GET' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Type', 'Client', 'Slug', 'URL', 'Message']);
      sheet.setFrozenRows(1);
    }

    let data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (_) { data = {}; }
    }

    const type    = (data.type || '').toString();
    const client  = (data.client || '').toString();
    const slug    = (data.slug || '').toString();
    const url     = (data.url || '').toString();
    const message = (data.message || '').toString();

    sheet.appendRow([new Date(), type, client, slug, url, message]);

    // Email the team
    const to = (data.notifyEmail || '').toString();
    if (to) {
      const isAccept = type === 'accept';
      const subject = isAccept
        ? `✅ Proposal ACCEPTED — ${client}`
        : `❓ Questions on proposal — ${client}`;
      const body = isAccept
        ? `${client} just accepted their proposal.\n\nProposal: ${url}\n\n` +
          `Next step: create the DocuSign contract and drop the signing link ` +
          `into the proposal's Contract section in the admin tool.`
        : `${client} submitted questions on their proposal.\n\nProposal: ${url}\n\n` +
          `Their message:\n${message || '(no message)'}`;
      MailApp.sendEmail({ to: to, subject: subject, body: body });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Run once from the editor to authorize scopes + smoke-test.
function testWrite() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  sheet.appendRow([new Date(), 'accept', 'TEST CLIENT', 'test-slug',
                   'https://www.theseason.nyc/p/test-slug', 'delete this row']);
}
