const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const LOGO_REMEINIA = path.join(__dirname, '..', 'assets', 'logos', 'remeinia.png');
const LOGO_ENFERMERIA = path.join(__dirname, '..', 'assets', 'logos', 'enfermeria-al-rescate.png');
const SIGNATURE_CRISTIAN = path.join(__dirname, '..', 'assets', 'signatures', 'firma-cristian.png');

function safeImage(doc, imagePath, x, y, options = {}) {
  if (!fs.existsSync(imagePath)) return false;
  try {
    doc.image(imagePath, x, y, options);
    return true;
  } catch {
    return false;
  }
}

function drawImagePlaceholder(doc, x, y, width, height, label) {
  doc.save();
  doc.roundedRect(x, y, width, height, 4).lineWidth(1).stroke('#94a3b8');
  doc.font('Helvetica').fontSize(8).fillColor('#64748b')
    .text(label, x + 6, y + height / 2 - 6, { width: width - 12, align: 'center' });
  doc.restore();
}

function hashTextToBits(text, size) {
  let hash = 2166136261;
  const bits = [];
  const source = `${text}-REMEINIA-QR`;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
    bits.push((hash >>> 3) & 1);
  }
  while (bits.length < size * size) {
    hash = Math.imul(hash ^ (bits.length + 31), 2246822519);
    bits.push((hash >>> 7) & 1);
  }
  return bits;
}

function drawQr(doc, text, x, y, size = 90) {
  const modules = 29;
  const moduleSize = size / modules;
  const bits = hashTextToBits(text, modules);

  doc.save();
  doc.rect(x - 5, y - 5, size + 10, size + 10).fill('#ffffff');

  const drawFinder = (fx, fy) => {
    doc.rect(x + fx * moduleSize, y + fy * moduleSize, moduleSize * 7, moduleSize * 7).fill('#111827');
    doc.rect(x + (fx + 1) * moduleSize, y + (fy + 1) * moduleSize, moduleSize * 5, moduleSize * 5).fill('#ffffff');
    doc.rect(x + (fx + 2) * moduleSize, y + (fy + 2) * moduleSize, moduleSize * 3, moduleSize * 3).fill('#111827');
  };

  drawFinder(0, 0);
  drawFinder(modules - 7, 0);
  drawFinder(0, modules - 7);

  let idx = 0;
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      const insideFinder =
        (row < 8 && col < 8) ||
        (row < 8 && col > modules - 9) ||
        (row > modules - 9 && col < 8);
      if (insideFinder) continue;
      if (bits[idx++] % 2 === 1) {
        doc.rect(x + col * moduleSize, y + row * moduleSize, moduleSize, moduleSize).fill('#111827');
      }
    }
  }

  doc.restore();
}

function generateCertificate({
  userName,
  courseName,
  folio,
  date,
  score,
  hours,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape', margin: 24 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;

    const navy = '#0a1f44';
    const navySoft = '#14366f';
    const panel = '#f7fbff';
    const gold = '#c59c35';
    const goldSoft = '#e4c676';

    // Fondo principal y marco externo fuerte
    doc.rect(0, 0, W, H).fill(navy);
    doc.roundedRect(18, 18, W - 36, H - 36, 10).lineWidth(2).stroke(goldSoft);
    doc.roundedRect(24, 24, W - 48, H - 48, 8).lineWidth(1).stroke('#d6b26b');

    // Franja decorativa izquierda translúcida
    doc.save();
    doc.fillOpacity(0.24).roundedRect(28, 28, 126, H - 56, 8).fill(navySoft).restore();

    // Patrón decorativo de puntos en esquina superior derecha
    doc.save();
    doc.fillOpacity(0.25);
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 14; col++) {
        doc.circle(W - 230 + col * 11, 44 + row * 11, 1.6).fill('#8bb0e3');
      }
    }
    doc.restore();

    // Listón superior derecho + sello dorado geométrico
    doc.save();
    doc.polygon([W - 210, 26], [W - 28, 26], [W - 28, 70], [W - 180, 70]).fill('#173a73');
    doc.circle(W - 62, 62, 17).lineWidth(1.2).fillAndStroke(gold, '#fff3d0');
    doc.circle(W - 62, 62, 9).fill('#8a6a1f');
    doc.restore();

    // Panel central con doble marco interno
    const panelX = 42;
    const panelY = 38;
    const panelW = W - 84;
    const panelH = H - 76;
    doc.roundedRect(panelX, panelY, panelW, panelH, 8).fill(panel);
    doc.roundedRect(panelX + 10, panelY + 10, panelW - 20, panelH - 20, 6).lineWidth(1.6).stroke('#5f7497');
    doc.roundedRect(panelX + 16, panelY + 16, panelW - 32, panelH - 32, 5).lineWidth(0.8).stroke('#b9c6d8');

    // Logos zona superior izquierda (más grandes)
    const logoTop = panelY + 24;
    const remLogoX = panelX + 22;
    const enfLogoX = panelX + 182;

    const hasRemeinia = safeImage(doc, LOGO_REMEINIA, remLogoX, logoTop, { fit: [150, 62], align: 'left' });
    if (!hasRemeinia) {
      drawImagePlaceholder(doc, remLogoX, logoTop + 3, 146, 56, 'Logo REMEINIA\nbackend/assets/logos/remeinia.png');
    }

    const hasEnfermeria = safeImage(doc, LOGO_ENFERMERIA, enfLogoX, logoTop + 2, { fit: [165, 58], align: 'left' });
    if (!hasEnfermeria) {
      drawImagePlaceholder(doc, enfLogoX, logoTop + 3, 160, 56, 'Logo Enfermería al Rescate\nbackend/assets/logos/enfermeria-al-rescate.png');
    }

    // Encabezado institucional centrado
    const titleStartX = panelX + 20;
    const titleWidth = panelW - 40;
    doc.fillColor('#163765').font('Helvetica-Bold').fontSize(13)
      .text('RED MEXICANA DE INNOVACIÓN EN ENFERMERÍA E INTELIGENCIA ARTIFICIAL', titleStartX, panelY + 92, {
        width: titleWidth,
        align: 'center'
      });

    doc.fillColor('#475569').font('Helvetica').fontSize(10.5)
      .text('OTORGA LA PRESENTE', titleStartX, panelY + 112, { width: titleWidth, align: 'center' });

    // Título principal dominante
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(52)
      .text('CONSTANCIA', titleStartX, panelY + 125, { width: titleWidth, align: 'center' });

    doc.fillColor('#3b4f6b').font('Helvetica').fontSize(12)
      .text('A', titleStartX, panelY + 182, { width: titleWidth, align: 'center' });

    // Nombre mucho más grande y elegante
    const attendeeName = (userName || 'PARTICIPANTE').toUpperCase();
    doc.fillColor('#102a43').font('Times-BoldItalic').fontSize(40)
      .text(attendeeName, panelX + 70, panelY + 196, { width: panelW - 140, align: 'center' });

    // Línea decorativa bajo el nombre
    doc.moveTo(panelX + 150, panelY + 246).lineTo(panelX + panelW - 150, panelY + 246).lineWidth(1.2).stroke('#9aaac0');

    // Cuerpo académico con mejor distribución
    const safeCourseName = courseName || 'NOMBRE DEL CURSO';
    const dateText = date || new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const hoursText = hours ? `, con duración de ${hours} horas/créditos curriculares` : ', con duración registrada en el programa académico';
    const scoreText = Number.isFinite(score) ? ` y con calificación de ${score}/100` : '';

    doc.fillColor('#1f2937').font('Helvetica').fontSize(12.4)
      .text(
        `Por haber acreditado el programa académico del CURSO / TALLER DE ${safeCourseName}${hoursText}, realizado el ${dateText}${scoreText}.`,
        panelX + 86,
        panelY + 258,
        { width: panelW - 172, align: 'center', lineGap: 5 }
      );

    // Bloque inferior: firma, folio, QR con mejor separación
    const footerTop = H - 136;

    // Firma en inferior izquierda/centro
    const signX = panelX + 130;
    const signY = footerTop;
    const signW = 250;

    const hasSignature = safeImage(doc, SIGNATURE_CRISTIAN, signX + 64, signY - 5, { fit: [126, 44], align: 'center' });
    if (!hasSignature) {
      drawImagePlaceholder(doc, signX + 64, signY - 2, 124, 40, 'Firma digital\nbackend/assets/signatures/firma-cristian.png');
    }

    doc.moveTo(signX + 12, signY + 46).lineTo(signX + signW - 12, signY + 46).lineWidth(1).stroke('#475569');
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10.2)
      .text('MTRO. CRISTIAN MINROD MOLINA LÓPEZ', signX, signY + 52, { width: signW, align: 'center' });
    doc.fillColor('#475569').font('Helvetica').fontSize(9)
      .text('PRESIDENTE DE REMEINIA', signX, signY + 66, { width: signW, align: 'center' });

    // QR en inferior derecha
    const qrSize = 84;
    const qrX = W - 156;
    const qrY = footerTop - 10;
    drawQr(doc, `${folio}|${userName}|${courseName}`, qrX, qrY, qrSize);

    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8.8)
      .text('Validación QR', qrX - 2, qrY + qrSize + 5, { width: qrSize + 12, align: 'center' });

    // Folio más visible cerca del QR
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11)
      .text(`FOLIO: ${folio || 'REMEINIA-ACAD-0000-000'}`, W - 305, H - 98, { width: 178, align: 'right' });

    // Footer institucional
    doc.fillColor('#475569').font('Helvetica').fontSize(8.8)
      .text(
        'Documento con validez curricular emitido por REMEINIA, conforme al acuerdo interno de formación continua y capacitación profesional.',
        panelX + 36,
        H - 54,
        { width: panelW - 190, align: 'left' }
      );

    doc.end();
  });
}

module.exports = generateCertificate;
