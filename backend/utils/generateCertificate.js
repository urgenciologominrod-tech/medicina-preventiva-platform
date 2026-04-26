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

function drawQr(doc, text, x, y, size = 88) {
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
    const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape', margin: 28 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;

    const navy = '#0f2347';
    const lightPanel = '#f8fbff';
    const gold = '#b48b2b';

    doc.rect(0, 0, W, H).fill(navy);

    doc.save().fillOpacity(0.18).rect(0, 0, 120, H).fill('#274b84').restore();

    for (let i = 0; i < 32; i++) {
      const px = W - 160 + (i % 8) * 14;
      const py = 32 + Math.floor(i / 8) * 14;
      doc.circle(px, py, 1.8).fillAndStroke('#7da6df', '#7da6df');
    }

    doc.roundedRect(34, 28, W - 68, H - 56, 8).fill(lightPanel);
    doc.roundedRect(46, 40, W - 92, H - 80, 6).lineWidth(1.2).stroke('#6b7e99');

    const logoY = 54;
    const remHeight = 45;
    const enfHeight = 42;

    const hasRemeinia = safeImage(doc, LOGO_REMEINIA, 70, logoY, { fit: [130, remHeight], align: 'left' });
    if (!hasRemeinia) {
      drawImagePlaceholder(doc, 70, logoY, 130, remHeight, 'Logo REMEINIA\nbackend/assets/logos/remeinia.png');
    }

    const hasEnfermeria = safeImage(doc, LOGO_ENFERMERIA, 210, logoY + 1, { fit: [140, enfHeight], align: 'left' });
    if (!hasEnfermeria) {
      drawImagePlaceholder(doc, 210, logoY, 140, enfHeight, 'Logo Enfermería al Rescate\nbackend/assets/logos/enfermeria-al-rescate.png');
    }

    doc.fillColor('#153766').font('Helvetica-Bold').fontSize(13)
      .text('RED MEXICANA DE INNOVACIÓN EN ENFERMERÍA E INTELIGENCIA ARTIFICIAL', 0, 110, {
        align: 'center',
        width: W,
      });

    doc.fillColor('#334155').font('Helvetica').fontSize(11)
      .text('OTORGA LA PRESENTE', 0, 136, { align: 'center', width: W });

    doc.fillColor(gold).font('Helvetica-Bold').fontSize(40)
      .text('CONSTANCIA', 0, 154, { align: 'center', width: W });

    doc.fillColor('#334155').font('Helvetica').fontSize(12)
      .text('A', 0, 202, { align: 'center', width: W });

    doc.fillColor('#102a43').font('Times-BoldItalic').fontSize(34)
      .text((userName || 'PARTICIPANTE').toUpperCase(), 90, 216, { align: 'center', width: W - 180 });

    doc.moveTo(170, 264).lineTo(W - 170, 264).lineWidth(1).stroke('#8fa0b5');

    const safeCourseName = courseName || 'NOMBRE DEL CURSO';
    const safeHours = hours || 'N/D';
    const scoreText = Number.isFinite(score) ? ` con calificación de ${score}/100` : '';

    doc.fillColor('#1f2937').font('Helvetica').fontSize(12)
      .text(
        `Por haber acreditado el programa académico del CURSO / TALLER DE ${safeCourseName}, con duración de ${safeHours} horas/créditos curriculares, realizado el ${date}.${scoreText}.`,
        90,
        276,
        { align: 'center', width: W - 180, lineGap: 4 }
      );

    const signatureX = W - 335;
    const signatureY = H - 152;
    const signatureW = 220;

    doc.moveTo(signatureX + 20, signatureY + 55).lineTo(signatureX + signatureW - 20, signatureY + 55).lineWidth(1).stroke('#475569');

    const hasSignature = safeImage(doc, SIGNATURE_CRISTIAN, signatureX + 45, signatureY + 6, { fit: [130, 44], align: 'center' });
    if (!hasSignature) {
      drawImagePlaceholder(doc, signatureX + 45, signatureY + 6, 130, 40, 'Firma digital\nbackend/assets/signatures/firma-cristian.png');
    }

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10)
      .text('MTRO. CRISTIAN MINROD MOLINA LÓPEZ', signatureX, signatureY + 60, { width: signatureW, align: 'center' });
    doc.fillColor('#475569').font('Helvetica').fontSize(9)
      .text('PRESIDENTE DE REMEINIA', signatureX, signatureY + 74, { width: signatureW, align: 'center' });

    const qrX = W - 132;
    const qrY = H - 132;
    drawQr(doc, `${folio}|${userName}|${courseName}`, qrX, qrY, 78);

    doc.fillColor('#334155').font('Helvetica').fontSize(8)
      .text('QR de validación', qrX - 3, qrY + 82, { width: 90, align: 'left' });

    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10)
      .text(`FOLIO: ${folio}`, 65, H - 86, { width: 280 });

    doc.fillColor('#475569').font('Helvetica').fontSize(8.5)
      .text(
        'Documento con validez curricular emitido por REMEINIA, conforme al acuerdo interno de formación continua y capacitación profesional.',
        65,
        H - 67,
        { width: W - 220, align: 'left' }
      );

    doc.end();
  });
}

module.exports = generateCertificate;
