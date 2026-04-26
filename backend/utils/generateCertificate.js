const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const LOGO_REMEINIA = path.join(__dirname, '..', 'assets', 'logos', 'remeinia.png');
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
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#64748b')
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
    const panel = '#f8fbff';
    const gold = '#c59c35';
    const goldSoft = '#e4c676';

    doc.rect(0, 0, W, H).fill(navy);
    doc.roundedRect(18, 18, W - 36, H - 36, 10).lineWidth(2).stroke(goldSoft);
    doc.roundedRect(24, 24, W - 48, H - 48, 8).lineWidth(1).stroke('#d6b26b');

    doc.save();
    doc.fillOpacity(0.2).roundedRect(30, 30, 120, H - 60, 8).fill(navySoft).restore();

    const panelX = 42;
    const panelY = 38;
    const panelW = W - 84;
    const panelH = H - 76;
    doc.roundedRect(panelX, panelY, panelW, panelH, 8).fill(panel);
    doc.roundedRect(panelX + 10, panelY + 10, panelW - 20, panelH - 20, 6).lineWidth(1.6).stroke('#5f7497');
    doc.roundedRect(panelX + 16, panelY + 16, panelW - 32, panelH - 32, 5).lineWidth(0.8).stroke('#b9c6d8');

    // Logo único institucional REMEINIA
    const logoMaxW = 190;
    const logoMaxH = 70;
    const logoX = panelX + 30;
    const logoY = panelY + 26;
    const hasRemeinia = safeImage(doc, LOGO_REMEINIA, logoX, logoY, { fit: [logoMaxW, logoMaxH], align: 'left', valign: 'top' });
    if (!hasRemeinia) {
      drawImagePlaceholder(doc, logoX, logoY + 4, logoMaxW, logoMaxH - 8, 'Logo REMEINIA\nbackend/assets/logos/remeinia.png');
    }

    // Jerarquía tipográfica superior
    const titleStartX = panelX + 20;
    const titleWidth = panelW - 40;
    doc
      .fillColor('#163765')
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('RED MEXICANA DE INNOVACIÓN EN ENFERMERÍA E INTELIGENCIA ARTIFICIAL', titleStartX, panelY + 96, {
        width: titleWidth,
        align: 'center'
      });

    doc.fillColor('#475569').font('Helvetica').fontSize(11).text('OTORGA LA PRESENTE', titleStartX, panelY + 121, {
      width: titleWidth,
      align: 'center'
    });

    doc.fillColor(gold).font('Helvetica-Bold').fontSize(54).text('CONSTANCIA', titleStartX, panelY + 136, {
      width: titleWidth,
      align: 'center'
    });

    doc.fillColor('#3b4f6b').font('Helvetica').fontSize(12).text('A', titleStartX, panelY + 196, {
      width: titleWidth,
      align: 'center'
    });

    const attendeeName = (userName || 'PARTICIPANTE').toUpperCase();
    doc.fillColor('#102a43').font('Times-BoldItalic').fontSize(39).text(attendeeName, panelX + 80, panelY + 207, {
      width: panelW - 160,
      align: 'center'
    });

    doc.moveTo(panelX + 165, panelY + 258).lineTo(panelX + panelW - 165, panelY + 258).lineWidth(1.2).stroke('#9aaac0');

    const safeCourseName = courseName || 'NOMBRE DEL CURSO';
    const dateText = date || new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const normalizedHours = Number.isFinite(hours) ? hours : 24;
    const hoursText = `con duración de ${normalizedHours} horas curriculares`;
    const scoreText = Number.isFinite(score) ? ` y con calificación de ${score}/100` : '';

    doc.fillColor('#1f2937').font('Helvetica').fontSize(12.2).text(
      `Por haber acreditado satisfactoriamente el programa académico del CURSO / TALLER DE ${safeCourseName}, ${hoursText}, realizado el ${dateText}${scoreText}.`,
      panelX + 90,
      panelY + 270,
      { width: panelW - 180, align: 'center', lineGap: 5 }
    );

    // Sección inferior organizada para evitar traslapes
    const footerTop = H - 147;

    // Firma a la izquierda, proporcional y estable ante reemplazo de imagen
    const signBlockX = panelX + 88;
    const signBlockY = footerTop;
    const signBlockW = 300;
    const signImgW = 145;
    const signImgH = 52;
    const signImgX = signBlockX + (signBlockW - signImgW) / 2;
    const signImgY = signBlockY - 8;

    const hasSignature = safeImage(doc, SIGNATURE_CRISTIAN, signImgX, signImgY, {
      fit: [signImgW, signImgH],
      align: 'center',
      valign: 'center'
    });
    if (!hasSignature) {
      drawImagePlaceholder(doc, signImgX, signImgY + 4, signImgW, signImgH - 10, 'Firma digital\nbackend/assets/signatures/firma-cristian.png');
    }

    doc.moveTo(signBlockX + 18, signBlockY + 48).lineTo(signBlockX + signBlockW - 18, signBlockY + 48).lineWidth(1).stroke('#475569');
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text('MTRO. CRISTIAN MINROD MOLINA LÓPEZ', signBlockX, signBlockY + 54, {
      width: signBlockW,
      align: 'center'
    });
    doc.fillColor('#475569').font('Helvetica').fontSize(9).text('PRESIDENTE DE REMEINIA', signBlockX, signBlockY + 68, {
      width: signBlockW,
      align: 'center'
    });

    // Folio en bloque dedicado (centro-derecha), separado del QR
    const resolvedFolio = folio || 'REMEINIA-ACAD-0000-000';
    const folioX = W - 340;
    const folioY = footerTop + 30;
    const folioW = 150;

    doc.roundedRect(folioX - 8, folioY - 8, folioW + 16, 42, 5).fillAndStroke('#edf3fb', '#c8d5e6');
    doc.fillColor('#475569').font('Helvetica').fontSize(8.8).text('FOLIO DE VALIDACIÓN', folioX, folioY, {
      width: folioW,
      align: 'center'
    });
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10.6).text(resolvedFolio, folioX, folioY + 13, {
      width: folioW,
      align: 'center'
    });

    // QR inferior derecha
    const qrSize = 86;
    const qrX = W - 145;
    const qrY = footerTop - 8;
    drawQr(doc, `${resolvedFolio}|${userName}|${courseName}`, qrX, qrY, qrSize);

    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8.8).text('Validación QR', qrX - 2, qrY + qrSize + 5, {
      width: qrSize + 12,
      align: 'center'
    });

    doc.fillColor('#475569').font('Helvetica').fontSize(8.8).text(
      'Documento con validez curricular emitido por REMEINIA, conforme al acuerdo interno de formación continua y capacitación profesional.',
      panelX + 36,
      H - 54,
      { width: panelW - 190, align: 'left' }
    );

    doc.end();
  });
}

module.exports = generateCertificate;
