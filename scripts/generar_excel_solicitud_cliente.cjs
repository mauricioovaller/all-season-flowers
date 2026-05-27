/**
 * Genera el Excel "Solicitud_Datos_NuevoCliente.xlsx" con los campos parametrizados
 * del proyecto multicliente, para que el nuevo cliente los diligencie.
 *
 * Uso: node scripts/generar_excel_solicitud_cliente.js
 * Salida: scripts/Solicitud_Datos_NuevoCliente.xlsx
 */

const XLSX = require("xlsx");
const path = require("path");

const headerStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" }, size: 11 },
  fill: { fgColor: { rgb: "1F4E79" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
};

const columnStyle = {
  alignment: { vertical: "top", wrapText: true },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
};

const llenarStyle = {
  fill: { fgColor: { rgb: "FFF2CC" } },
  alignment: { vertical: "top", wrapText: true },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
};

const ejemploStyle = {
  font: { color: { rgb: "666666" }, size: 10, italic: true },
  alignment: { vertical: "top", wrapText: true },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
};

function buildSheet(title, rows, colWidths) {
  const header = ["Campo", "Descripción", "Ejemplo (All Season)", "Ejemplo (Flagracol)", "RESPUESTA"];
  const data = [header, ...rows];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!cols"] = colWidths.map((w) => ({ wch: w }));

  for (let c = 0; c < header.length; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[addr]) ws[addr] = {};
    ws[addr].s = headerStyle;
  }

  for (let r = 1; r < data.length; r++) {
    for (let c = 0; c < header.length; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = {};
      if (c === 4) {
        ws[addr].s = llenarStyle;
      } else if (c >= 2 && c <= 3) {
        ws[addr].s = ejemploStyle;
      } else {
        ws[addr].s = columnStyle;
      }
    }
  }

  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: header.length - 1 } }) };

  return ws;
}

// ── Hoja 1: Identidad Empresarial ──────────────────────────────────────────
const identidadRows = [
  ["Nombre legal", "Razón social exacta ante cámara de comercio", "ALL SEASON FLOWERS SAS", "FLAGRACOL SAS", ""],
  ["Nombre corto", "Nombre comercial sin el tipo societario", "ALL SEASON FLOWERS", "FLAGRACOL", ""],
  ["Nombre largo", 'Nombre con tipo societario (ej: S.A.S)', "ALL SEASON FLOWERS S.A.S", "FLAGRACOL S.A.S", ""],
  ["Título de la app", "Se muestra en pestaña del navegador, header y sidebar", "All Season Flowers", "Flagracol SAS", ""],
  ["Lema / Eslogan", "Frase corta que acompaña el logo en header y dashboard", "Flowers & Ornamentals", "Flores de Colombia", ""],
  ["Iniciales", "2 letras para el icono del sidebar colapsado", "AS", "FS", ""],
  ["NIT", "Número de Identificación Tributaria", "901.984.016-8", "901.104.002-0", ""],
  ["Logo", "Archivo de imagen (JPG/PNG, preferiblemente cuadrado, máximo 500x500px)", "LogoAllSeason.jpg", "LogoFlagracol.jpg", "Adjuntar archivo"],
];

// ── Hoja 2: Contacto ───────────────────────────────────────────────────────
const contactoRows = [
  ["Representante legal", "Nombre completo del representante legal", "ERIKA JULEY GONZALEZ CHINGATE", "DANIEL ALBERTO LOPEZ", ""],
  ["Cédula Rep. Legal", "Número de documento de identidad", "1.073.525.441", "80.096.240", ""],
  ["Dirección", "Dirección física de la empresa", "Finca Villa Clemencia Vrd. Prado", "CALLE 163 N 50-80 INT 10 OF 233", ""],
  ["Ciudad / Depto / País", "Ubicación completa", "Facatativa, Cundinamarca, Colombia", "Bogota, Colombia", ""],
  ["Teléfono", "Teléfono(s) principal(es) con indicativo", "(+057) 3114677282 - 3023090940", "(+057) 316 507 95 27", ""],
  ["Email", "Correo electrónico corporativo", "freshfloral.erikajuley@gmail.com", "logistica@flagracol.com.co", ""],
];

// ── Hoja 3: ICA / Fitosanitario ────────────────────────────────────────────
const icaRows = [
  ["Registro ICA", "Número de registro ante el ICA en la factura", "REGISTRO ICA EXP250201", "REGISTRO ICA 25123386", ""],
  ["Cultivo - Reg. ICA", "Código del cultivo registrado ante el ICA", "EXP250201", "25123386", ""],
  ["Inspector — Nombre", "Nombre completo del inspector fitosanitario", "JOSE YAIR FONSECA CAMACHO", "DANIEL ROBERTO LOPEZ RODRIGUEZ", ""],
  ["Inspector — Cédula", "Número de documento del inspector", "1073514261", "4.092.426", ""],
  ["Inspector — TP", "Tarjeta Profesional del inspector", "091019-0567503", "5106", ""],
  ["Inspector — Reg. SV", "Registro S.V. del inspector", "2502027", "00000", ""],
];

// ── Hoja 4: Información Técnica (solo lectura) ─────────────────────────────
const tecnicaRows = [
  ["Ruta base en servidor", "Carpeta donde se aloja la SPA en el hosting", "/DatenBankenApp/{NombreCliente}/", "Define el desarrollador", "NO LLENAR"],
  ["Base de datos MySQL", "Nombre de la base de datos dedicada al cliente", "datenban_{NombreCliente}", "Define el desarrollador", "NO LLENAR"],
  ["Usuario BD", "Usuario MySQL con permisos sobre la BD", "datenban_{Admin/Lectura}_{NombreCliente}", "Define el desarrollador", "NO LLENAR"],
  ["API URL", "URL base de los endpoints PHP", "https://portal.datenbankensoluciones.com.co/DatenBankenApp/{NombreCliente}/Api", "Define el desarrollador", "NO LLENAR"],
];

// ── Construir libro ────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

const ws1 = buildSheet("Identidad Empresarial", identidadRows, [28, 52, 36, 36, 32]);
const ws2 = buildSheet("Contacto", contactoRows, [28, 52, 36, 36, 32]);
const ws3 = buildSheet("ICA - Fitosanitario", icaRows, [28, 52, 36, 36, 32]);
const ws4 = buildSheet("Info Técnica (solo lectura)", tecnicaRows, [30, 58, 38, 36, 36]);

// Aplicar color gris de fondo a hoja 4 (solo lectura)
for (const cellRef of Object.keys(ws4)) {
  if (cellRef.startsWith("!") || cellRef === "!ref" || cellRef === "!cols" || cellRef === "!autofilter") continue;
  const cell = XLSX.utils.decode_cell(cellRef);
  if (cell.r > 0 && !ws4[cellRef].s) {
    ws4[cellRef].s = { ...columnStyle, fill: { fgColor: { rgb: "E2EFDA" } } };
  }
}

XLSX.utils.book_append_sheet(wb, ws1, "1. Identidad Empresarial");
XLSX.utils.book_append_sheet(wb, ws2, "2. Contacto");
XLSX.utils.book_append_sheet(wb, ws3, "3. ICA - Fitosanitario");
XLSX.utils.book_append_sheet(wb, ws4, "4. Info Técnica (no llenar)");

const outPath = path.join(__dirname, "Solicitud_Datos_NuevoCliente.xlsx");
XLSX.writeFile(wb, outPath);

console.log(`✅ Excel generado: ${outPath}`);
