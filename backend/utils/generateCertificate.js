const PDFDocument = require('pdfkit');

function generateCertificate({ userName, courseName, folio, date }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape', margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const H = doc.page.height;

    // Fondo con degradado simulado (rectángulos)
    doc.rect(0, 0, W, H).fill('#f0f9ff');
    doc.rect(0, 0, W, 12).fill('#0ea5e9');
    doc.rect(0, H - 12, W, 12).fill('#0ea5e9');
    doc.rect(0, 0, 12, H).fill('#0ea5e9');
    doc.rect(W - 12, 0, 12, H).fill('#0ea5e9');

    // Borde interior decorativo
    doc.rect(20, 20, W - 40, H - 40).stroke('#0ea5e9');

    // Encabezado institucional
    doc.fillColor('#0c4a6e').fontSize(13).font('Helvetica-Bold')
       .text('ÁREA DE MEDICINA PREVENTIVA', 0, 45, { align: 'center', width: W });

    doc.fillColor('#0ea5e9').fontSize(9).font('Helvetica')
       .text('Plataforma de Capacitación y Competencias Digitales', 0, 62, { align: 'center', width: W });

    // Línea separadora
    doc.moveTo(80, 80).lineTo(W - 80, 80).stroke('#0ea5e9');

    // Título principal
    doc.fillColor('#0c4a6e').fontSize(38).font('Helvetica-Bold')
       .text('CONSTANCIA DE CAPACITACIÓN', 0, 100, { align: 'center', width: W });

    // Texto de otorgamiento
    doc.fillColor('#374151').fontSize(14).font('Helvetica')
       .text('Se hace constar que:', 0, 165, { align: 'center', width: W });

    // Nombre del participante
    doc.fillColor('#0c4a6e').fontSize(30).font('Helvetica-Bold')
       .text(userName.toUpperCase(), 0, 190, { align: 'center', width: W });

    // Línea bajo nombre
    doc.moveTo(W / 2 - 180, 230).lineTo(W / 2 + 180, 230).lineWidth(1.5).stroke('#0c4a6e');

    doc.fillColor('#374151').fontSize(13).font('Helvetica')
       .text('Ha completado satisfactoriamente el curso:', 0, 245, { align: 'center', width: W });

    // Nombre del curso
    doc.fillColor('#0369a1').fontSize(18).font('Helvetica-Bold')
       .text(`"${courseName}"`, 0, 268, { align: 'center', width: W });

    doc.fillColor('#374151').fontSize(12).font('Helvetica')
       .text('habiendo aprobado el examen de evaluación correspondiente.', 0, 300, { align: 'center', width: W });

    // Fecha y folio
    doc.fillColor('#6b7280').fontSize(11).font('Helvetica')
       .text(`Fecha de emisión: ${date}`, 90, 345)
       .text(`Folio: ${folio}`, 90, 362);

    // Firma
    doc.moveTo(W - 250, 355).lineTo(W - 80, 355).stroke('#374151');
    doc.fillColor('#374151').fontSize(10).font('Helvetica')
       .text('Coordinación de Medicina Preventiva', W - 280, 360, { width: 220, align: 'center' });

    doc.end();
  });
}

module.exports = generateCertificate;
