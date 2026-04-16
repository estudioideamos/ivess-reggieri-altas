const SPREADSHEET_ID = "1sLnGj08IgYqo3HnS5GRQGRC5yEb2V2hQyXZmPAtZ5RE";
const CLIENTS_SHEET_NAME = "Clientes";
const ORDERS_SHEET_NAME = "Pedidos";
const NOTIFICATION_EMAIL = "r.lavega@ideamos.com.ar";

function doGet(e) {
  const params = e.parameter || {};
  const action = normalizeValue_(params.action);

  if (action === "lookup") {
    const response = lookupCustomer_(params.phone);

    if (params.callback) {
      return jsonpResponse_(params.callback, response);
    }

    return jsonResponse_(response);
  }

  return jsonResponse_({
    ok: true,
    message: "Apps Script de clientes Ivess activo",
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");

    if (normalizeValue_(payload.action) === "order") {
      registerOrder_(payload);
      return jsonResponse_({ ok: true });
    }

    return jsonResponse_({ ok: false, error: "unknown_action" });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error) });
  }
}

function lookupCustomer_(phoneRaw) {
  const phoneToFind = normalizePhone_(phoneRaw);

  if (!phoneToFind) {
    return { ok: false, error: "invalid_phone" };
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CLIENTS_SHEET_NAME);

  if (!sheet) {
    return { ok: false, error: "clients_sheet_missing" };
  }

  const data = sheet.getDataRange().getDisplayValues();

  if (data.length < 2) {
    return { ok: false, error: "clients_sheet_empty" };
  }

  const headers = data[0];
  const rows = data.slice(1);
  const indexes = getColumnIndexes_(headers);

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowPhone = normalizePhone_(readColumnByAliases_(row, indexes, [
      "telefono",
      "celular",
      "whatsapp",
      "movil",
    ]));

    if (!rowPhone) {
      continue;
    }

    if (phoneMatches_(phoneToFind, rowPhone)) {
      return {
        ok: true,
        customer: {
          firstName: readColumnByAliases_(row, indexes, ["nombre", "first_name"]),
          lastName: readColumnByAliases_(row, indexes, ["apellido", "last_name"]),
          email: readColumnByAliases_(row, indexes, ["email", "correo"]),
          address: readColumnByAliases_(row, indexes, ["direccion", "domicilio"]),
          city: readColumnByAliases_(row, indexes, ["localidad", "ciudad"]),
          province: readColumnByAliases_(row, indexes, ["provincia"]),
          phone: rowPhone,
        },
      };
    }
  }

  return { ok: false, error: "not_found" };
}

function registerOrder_(payload) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(ORDERS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(ORDERS_SHEET_NAME);
    sheet.appendRow([
      "Fecha",
      "Telefono",
      "Nombre",
      "Apellido",
      "Email",
      "Direccion",
      "Localidad",
      "Provincia",
      "Producto",
      "Cantidad",
      "Precio estimado",
      "Origen",
    ]);
  }

  sheet.appendRow([
    payload.submittedAt || new Date().toISOString(),
    payload.phone || "",
    payload.firstName || "",
    payload.lastName || "",
    payload.email || "",
    payload.address || "",
    payload.city || "",
    payload.province || "",
    payload.plan || "",
    payload.planQuantity || "",
    payload.planPrice || "",
    payload.source || "",
  ]);

  if (NOTIFICATION_EMAIL && NOTIFICATION_EMAIL !== "tu-email@dominio.com") {
    GmailApp.sendEmail(
      NOTIFICATION_EMAIL,
      "Nuevo pedido de reposicion - IVESS Reggieri",
      buildOrderEmail_(payload),
    );
  }
}

function buildOrderEmail_(payload) {
  return [
    "Nuevo pedido de reposicion recibido.",
    "",
    "Cliente: " + (payload.firstName || "-") + " " + (payload.lastName || "-"),
    "Telefono: " + (payload.phone || "-"),
    "Email: " + (payload.email || "-"),
    "Direccion: " + (payload.address || "-"),
    "Localidad: " + (payload.city || "-"),
    "Provincia: " + (payload.province || "-"),
    "Producto: " + (payload.plan || "-"),
    "Cantidad: " + (payload.planQuantity || "-"),
    "Total estimado: " + (payload.planPrice || "-"),
  ].join("\n");
}

function getColumnIndexes_(headers) {
  const map = {};

  for (let i = 0; i < headers.length; i += 1) {
    const key = normalizeHeader_(headers[i]);

    if (key) {
      map[key] = i;
    }
  }

  return map;
}

function readColumnByAliases_(row, indexes, aliases) {
  for (let i = 0; i < aliases.length; i += 1) {
    const normalizedAlias = normalizeHeader_(aliases[i]);

    if (Object.prototype.hasOwnProperty.call(indexes, normalizedAlias)) {
      return row[indexes[normalizedAlias]] || "";
    }
  }

  return "";
}

function normalizeHeader_(value) {
  return normalizeValue_(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizePhone_(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.length > 10 ? digits.slice(-10) : digits;
}

function phoneMatches_(inputPhone, rowPhone) {
  if (!inputPhone || !rowPhone) {
    return false;
  }

  return inputPhone === rowPhone || inputPhone.endsWith(rowPhone) || rowPhone.endsWith(inputPhone);
}

function normalizeValue_(value) {
  return String(value || "").trim();
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function jsonpResponse_(callback, data) {
  const safeCallback = String(callback || "").replace(/[^a-zA-Z0-9_.$]/g, "");

  if (!safeCallback) {
    return jsonResponse_({ ok: false, error: "invalid_callback" });
  }

  return ContentService.createTextOutput(
    safeCallback + "(" + JSON.stringify(data) + ");",
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
