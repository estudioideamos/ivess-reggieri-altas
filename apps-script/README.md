# Google Sheets + Mail setup (Option 1)

## 1) Create the spreadsheet
- Create a new Google Sheet for leads.
- Open `Extensions > Apps Script`.

## 2) Paste the script
- Replace the default script with the contents of `apps-script/Code.gs`.
- Set `NOTIFICATION_EMAIL` in `Code.gs` to your real email.

## 3) Deploy as Web App
- Click `Deploy > New deployment`.
- Type: `Web app`.
- Execute as: `Me`.
- Who has access: `Anyone`.
- Deploy and copy the Web App URL.

## 4) Connect the frontend
- In `index.html`, set:
  - `window.APP_CONFIG.appsScriptUrl = "YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL";`

## 5) Test
- Open the site.
- Complete the form and submit.
- Verify:
  - a new row in the sheet
  - email notification received
