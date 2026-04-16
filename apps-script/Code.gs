const SHEET_NAME = "Leads";
const NOTIFICATION_EMAIL = "tu-email@dominio.com";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const sheet = getOrCreateSheet_();
    const row = mapLeadToRow_(payload);
    sheet.appendRow(row);

    if (NOTIFICATION_EMAIL && NOTIFICATION_EMAIL !== "tu-email@dominio.com") {
      GmailApp.sendEmail(
        NOTIFICATION_EMAIL,
        "Nueva solicitud de alta - IVESS Reggieri",
        buildMailBody_(payload),
      );
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error) });
  }
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "Fecha",
      "Tipo de servicio",
      "Direccion",
      "Localidad",
      "Provincia",
      "Nombre",
      "Apellido",
      "Codigo area",
      "Celular",
      "Email",
      "Tipo inmueble",
      "Franja horaria",
      "Frecuencia",
      "Producto",
      "Cantidad",
      "Precio estimado",
      "Notas",
      "Origen",
    ]);
  }

  return sheet;
}

function mapLeadToRow_(payload) {
  return [
    payload.submittedAt || new Date().toISOString(),
    payload.serviceType || "",
    payload.address || "",
    payload.city || "",
    payload.province || "",
    payload.firstName || "",
    payload.lastName || "",
    payload.areaCode || "",
    payload.phone || "",
    payload.email || "",
    payload.propertyType || "",
    payload.timeSlot || "",
    payload.frequency || "",
    payload.plan || "",
    payload.planQuantity || "",
    payload.planPrice || "",
    payload.notes || "",
    payload.source || "",
  ];
}

function buildMailBody_(payload) {
  return [
    "Nueva solicitud de alta recibida.",
    "",
    "Tipo de servicio: " + (payload.serviceType || "-"),
    "Direccion: " + (payload.address || "-"),
    "Localidad: " + (payload.city || "-"),
    "Provincia: " + (payload.province || "-"),
    "Contacto: " + (payload.firstName || "-") + " " + (payload.lastName || "-"),
    "Telefono: " + (payload.areaCode || "-") + " " + (payload.phone || "-"),
    "Email: " + (payload.email || "-"),
    "Producto: " + (payload.plan || "-"),
    "Cantidad: " + (payload.planQuantity || "-"),
    "Precio estimado: " + (payload.planPrice || "-"),
    "Notas: " + (payload.notes || "-"),
  ].join("\n");
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
