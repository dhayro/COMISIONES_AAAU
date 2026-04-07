const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');

// Función auxiliar para convertir números a letras
class EnLetras {
  constructor() {
    this.Void = "";
    this.SP = " ";
    this.Dot = ".";
    this.Zero = "0";
    this.Neg = "Menos";
  }

  ValorEnLetras(x, Moneda) {
    let s = "";
    let Ent = "";
    let Frc = "";
    let Signo = "";

    if (parseFloat(x) < 0) {
      Signo = this.Neg + " ";
    } else {
      Signo = "";
    }

    s = parseFloat(x).toFixed(2);
    const Pto = s.indexOf(this.Dot);

    if (Pto === -1) {
      Ent = s;
      Frc = this.Void;
    } else {
      Ent = s.substring(0, Pto);
      Frc = s.substring(Pto + 1);
    }

    if (Ent === this.Zero || Ent === this.Void) {
      s = "Cero ";
    } else if (Ent.length > 7) {
      s =
        this.SubValLetra(parseInt(Ent.substring(0, Ent.length - 6))) +
        "Millones " +
        this.SubValLetra(parseInt(Ent.substring(Ent.length - 6)));
    } else {
      s = this.SubValLetra(parseInt(Ent));
    }

    if (
      s.substring(s.length - 9, s.length) === "Millones " ||
      s.substring(s.length - 7, s.length) === "Millón "
    ) {
      s = s + "de ";
    }

    s = s + Moneda;

    if (Frc !== this.Void) {
      s = s + " " + Frc + "/100";
    }

    return Signo + s + " ";
  }

  SubValLetra(numero) {
    let x = numero.toString();
    let n = x.length;
    let Tem = this.Void;
    let i = n;
    let Rtn = "";

    while (i > 0) {
      Tem = this.Parte(
        parseInt(x.substring(n - i, n - i + 1) + "0".repeat(i - 1))
      );
      if (Tem !== "Cero") Rtn += Tem + this.SP;
      i = i - 1;
    }

    Rtn = Rtn.replace(/ Mil Mil/g, " Un Mil");
    while (true) {
      const Ptr = Rtn.indexOf("Mil ");
      if (Ptr !== -1) {
        if (Rtn.indexOf("Mil ", Ptr + 1) !== -1) {
          Rtn =
            Rtn.substring(0, Ptr) +
            Rtn.substring(Ptr + 4, Rtn.length);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    let Ptr = -1;
    while ((Ptr = Rtn.indexOf("Cien ", Ptr + 1)) !== -1) {
      const Tem2 = Rtn.substring(Ptr + 5, Ptr + 6);
      if (Tem2 === "M" || Tem2 === this.Void) {
        // no cambiar
      } else {
        Rtn = Rtn.substring(0, Ptr) + "Ciento" + Rtn.substring(Ptr + 4);
      }
    }

    Rtn = Rtn.replace(/Diez Un/g, "Once");
    Rtn = Rtn.replace(/Diez Dos/g, "Doce");
    Rtn = Rtn.replace(/Diez Tres/g, "Trece");
    Rtn = Rtn.replace(/Diez Cuatro/g, "Catorce");
    Rtn = Rtn.replace(/Diez Cinco/g, "Quince");
    Rtn = Rtn.replace(/Diez Seis/g, "Dieciseis");
    Rtn = Rtn.replace(/Diez Siete/g, "Diecisiete");
    Rtn = Rtn.replace(/Diez Ocho/g, "Dieciocho");
    Rtn = Rtn.replace(/Diez Nueve/g, "Diecinueve");
    Rtn = Rtn.replace(/Veinte Un/g, "Veintiun");
    Rtn = Rtn.replace(/Veinte Dos/g, "Veintidos");
    Rtn = Rtn.replace(/Veinte Tres/g, "Veintitres");
    Rtn = Rtn.replace(/Veinte Cuatro/g, "Veinticuatro");
    Rtn = Rtn.replace(/Veinte Cinco/g, "Veinticinco");
    Rtn = Rtn.replace(/Veinte Seis/g, "Veintiseís");
    Rtn = Rtn.replace(/Veinte Siete/g, "Veintisiete");
    Rtn = Rtn.replace(/Veinte Ocho/g, "Veintiocho");
    Rtn = Rtn.replace(/Veinte Nueve/g, "Veintinueve");

    if (Rtn.substring(0, 1) === "M") Rtn = "Un " + Rtn;

    for (let i = 65; i <= 88; i++) {
      if (i !== 77) {
        Rtn = Rtn.replace(
          new RegExp("a " + String.fromCharCode(i), "g"),
          "* y " + String.fromCharCode(i)
        );
      }
    }
    Rtn = Rtn.replace(/\*/g, "a");

    return Rtn;
  }

  Parte(x) {
    let t = "";
    let i = 0;

    const partes = {
      0: "Cero",
      1: "Un",
      2: "Dos",
      3: "Tres",
      4: "Cuatro",
      5: "Cinco",
      6: "Seis",
      7: "Siete",
      8: "Ocho",
      9: "Nueve",
      10: "Diez",
      20: "Veinte",
      30: "Treinta",
      40: "Cuarenta",
      50: "Cincuenta",
      60: "Sesenta",
      70: "Setenta",
      80: "Ochenta",
      90: "Noventa",
      100: "Cien",
      200: "Doscientos",
      300: "Trescientos",
      400: "Cuatrocientos",
      500: "Quinientos",
      600: "Seiscientos",
      700: "Setecientos",
      800: "Ochocientos",
      900: "Novecientos",
      1000: "Mil",
      1000000: "Millón",
    };

    if (partes[x]) {
      t = partes[x];
    } else {
      i = 1;
      while (i !== 0 && !partes[x]) {
        i = i + 1;
        x = Math.floor(x / 1000);
        if (x === 0) i = 0;
      }

      if (partes[x * Math.pow(1000, i - 1)]) {
        t = partes[x * Math.pow(1000, i - 1)];
      }
    }

    const sufijos = {
      0: "",
      1: " Mil",
      2: " Millones",
      3: " Billones",
    };

    return t + (sufijos[i] || "");
  }
}

// Función para generar PDF de comisión (UNA PÁGINA POR COMISIONADO) - USANDO PUPPETEER CON LANDSCAPE
exports.generarPDFComision = async (req, res) => {
  const puppeteer = require('puppeteer');
  
  try {
    const { comision_id } = req.params;
    const { comision_data, comisionado_id } = req.body;

    if (!comision_data) {
      return res.status(400).json({ error: "Datos de comisión requeridos" });
    }

    console.log("=== GENERANDO PDF CON PUPPETEER EN LANDSCAPE ===");

    const comision = comision_data;
    const enLetras = new EnLetras();

    // Filtrar y agrupar comisionados
    let comisionadosAMostrar = comision.comisionados;
    if (comisionado_id) {
      const comisionadosFiltrados = comision.comisionados.filter(c => c.usuario_id === comisionado_id);
      if (comisionadosFiltrados.length > 1) {
        const comisionadoAgrupado = {
          ...comisionadosFiltrados[0],
          monto: comisionadosFiltrados.reduce((sum, c) => sum + parseFloat(c.monto), 0),
          dias: comisionadosFiltrados.reduce((sum, c) => sum + parseInt(c.dias), 0),
        };
        comisionadosAMostrar = [comisionadoAgrupado];
      } else {
        comisionadosAMostrar = comisionadosFiltrados;
      }
    }

    // Obtener ámbito
    let ambitoDelUsuario = comision.ambito_nombre || "SIN DIRECCIÓN ASIGNADA";
    if (comisionadosAMostrar && comisionadosAMostrar.length > 0) {
      const primeraAmbito = comisionadosAMostrar[0].ambito_nombre;
      if (primeraAmbito) {
        ambitoDelUsuario = primeraAmbito;
      }
    }

    // Calcular totales
    let totalMonto = 0;
    let totalDias = 0;
    const filas = comisionadosAMostrar.map(c => {
      const monto = parseFloat(c.monto);
      const dias = parseInt(c.dias);
      totalMonto += monto;
      totalDias += dias;
      
      return `
        <tr>
          <td>${c.usuario_nombre || ''}</td>
          <td>${c.cargo_nombre || ''}</td>
          <td>${comision.observacion || ''}</td>
          <td>${comision.lugar || ''}</td>
          <td style="text-align: center;">${dias}</td>
          <td style="text-align: center;">${new Date(c.fecha_salida).toLocaleDateString('es-ES')}</td>
          <td style="text-align: center;">${new Date(c.fecha_retorno).toLocaleDateString('es-ES')}</td>
          <td style="text-align: right;">S/. ${monto.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Generar HTML con LANDSCAPE
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 10px; padding: 15mm; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 14px; font-weight: bold; margin: 10px 0; }
          .header h2 { font-size: 12px; font-weight: bold; margin: 10px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { 
            background-color: #4F46E5; 
            color: white; 
            padding: 8px; 
            text-align: center; 
            font-weight: bold; 
            font-size: 9px;
            border: 1px solid #ccc;
          }
          td { 
            padding: 8px; 
            border: 1px solid #ccc; 
            font-size: 9px;
            vertical-align: middle;
          }
          .total-row { font-weight: bold; background-color: #f0f0f0; }
          .total-row td { background-color: #f0f0f0; }
          .signature-section { 
            margin-top: 40px; 
            text-align: center; 
            margin-bottom: 20px;
          }
          .signature-line { 
            border-top: 1px solid black; 
            width: 200px; 
            margin: 30px auto 5px auto; 
          }
          .footer { text-align: center; font-size: 9px; margin-top: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 9px;">${ambitoDelUsuario}</div>
          <div style="font-size: 8px;">Oficina de Administración - Unidad de Recursos Humanos</div>
          <h1>ANEXO N° 01</h1>
          <h2>PROGRAMACIÓN MENSUAL DE COMISIÓN DE SERVICIOS</h2>
        </div>

        <div class="info-row">
          <div><strong>DIRECCIÓN / OFICINA:</strong> ${ambitoDelUsuario}</div>
          <div><strong>PERÍODO:</strong> ${new Date(comision.fecha_salida).toLocaleDateString('es-ES')} - ${new Date(comision.fecha_retorno).toLocaleDateString('es-ES')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>COMISIONADO</th>
              <th>CARGO</th>
              <th>ACTIVIDAD</th>
              <th>PARTIDA</th>
              <th>DÍAS</th>
              <th>FECHA SALIDA</th>
              <th>FECHA RETORNO</th>
              <th>MONTO (S/.)</th>
            </tr>
          </thead>
          <tbody>
            ${filas}
            <tr class="total-row">
              <td colspan="4">TOTAL</td>
              <td style="text-align: center;">${totalDias}</td>
              <td colspan="2"></td>
              <td style="text-align: right;">S/. ${totalMonto.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-line"></div>
          <div style="font-weight: bold; font-size: 10px;">FIRMA DEL JEFE O DIRECTOR</div>
        </div>

        <div class="footer">
          Generado el: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}
        </div>
      </body>
      </html>
    `;

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle2' });
    
    // ✓ LANDSCAPE CON PUPPETEER
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,  // ✓ LANDSCAPE NATIVO EN PUPPETEER
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();

    // Configurar respuesta
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="comision_${comision_id}_${Date.now()}.pdf"`
    );

    console.log("✅ PDF LANDSCAPE generado exitosamente con Puppeteer");

    res.send(pdfBuffer);

  } catch (err) {
    console.error("Error generando PDF:", err);
    res.status(500).json({ error: `Error al generar PDF: ${err.message}` });
  }
};

// Función para generar PDF con múltiples comisiones agrupadas
exports.generarPDFMultipleComisiones = async (req, res) => {
  try {
    const { comisiones_data } = req.body;

    if (!comisiones_data || !Array.isArray(comisiones_data)) {
      return res.status(400).json({ error: "Array de comisiones requerido" });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 25,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="comisiones_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    const enLetras = new EnLetras();

    comisiones_data.forEach((comision, index) => {
      if (index > 0) doc.addPage();

      // Título
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("ANEXO N° 01", { align: "center" });
      doc
        .fontSize(12)
        .text("PROGRAMACIÓN MENSUAL DE COMISIÓN DE SERVICIOS", {
          align: "center",
        });

      doc.moveDown(0.5);

      // Información general
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("DIRECCIÓN / OFICINA: ", { continued: true })
        .font("Helvetica")
        .text(comision.ambito_nombre || "");

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("LUGAR: ", { continued: true })
        .font("Helvetica")
        .text(comision.lugar || "");

      doc.moveDown(1);

      // Tabla de comisionados
      const tableTop = doc.y;
      const col1 = 30;
      const col2 = 200;
      const col3 = 350;
      const col4 = 480;

      // Encabezados
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("COMISIONADO", col1, tableTop, { width: 170 })
        .text("CLASIFICADOR", col2, tableTop, { width: 150 })
        .text("DÍAS", col3, tableTop, { width: 50 })
        .text("MONTO", col4, tableTop, { width: 70, align: "right" });

      doc.moveTo(col1, tableTop + 20).lineTo(550, tableTop + 20).stroke();

      let y = tableTop + 25;
      let totalMonto = 0;

      // Datos de comisionados
      if (comision.comisionados && comision.comisionados.length > 0) {
        comision.comisionados.forEach((com) => {
          const monto = parseFloat(com.monto);
          totalMonto += monto;

          doc
            .fontSize(8)
            .font("Helvetica")
            .text(com.usuario_nombre || "", col1, y, { width: 170 })
            .text(com.clasificador_nombre || "", col2, y, { width: 150 })
            .text(com.dias || "", col3, y, { width: 50, align: "center" })
            .text(`S/. ${monto.toFixed(2)}`, col4, y, {
              width: 70,
              align: "right",
            });

          y += 20;
        });
      }

      doc.moveTo(col1, y).lineTo(550, y).stroke();

      y += 10;

      // Total
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`TOTAL: S/. ${totalMonto.toFixed(2)}`, col1, y);

      y += 15;

      // Total en letras
      const totalEnLetras = enLetras.ValorEnLetras(totalMonto, "Soles");
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("SON: ", { continued: true })
        .font("Helvetica")
        .text(totalEnLetras);

      y += 30;

      // Observación
      if (comision.observacion) {
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("OBSERVACIÓN:", col1, y);
        doc.fontSize(8).font("Helvetica").text(comision.observacion, col1, y + 15, {
          width: 500,
          align: "justify",
        });
      }
    });

    doc.end();
  } catch (err) {
    console.error("Error generando PDF:", err);
    res.status(500).json({ error: `Error al generar PDF: ${err.message}` });
  }
};

/**
 * Busca en la BD el meta_id basado en el número de meta extraído del PDF
 * @param {string} numeroMeta - Número de meta (ej: "072")
 * @param {Connection} connection - Conexión MySQL
 * @returns {Promise<number|null>} ID de la meta o null
 */
async function findMetaIdByNumero(numeroMeta, connection) {
  try {
    const [results] = await connection.query(
      'SELECT id FROM metas WHERE numero_meta = ?',
      [numeroMeta]
    );
    return results.length > 0 ? results[0].id : null;
  } catch (error) {
    console.error('❌ Error buscando meta:', error.message);
    return null;
  }
}

/**
 * Busca en la BD el fuente_financiamiento_id basado en el texto extraído del PDF
 * @param {string} fuenteText - Texto de fuente (ej: "RECURSOS ORDINARIOS")
 * @param {Connection} connection - Conexión MySQL
 * @returns {Promise<number|null>} ID de la fuente o null
 */
async function findFuenteIdByNombre(fuenteText, connection) {
  try {
    // Búsqueda flexible (LIKE) para tolerar variaciones
    const [results] = await connection.query(
      'SELECT id FROM fuentes_financiamiento WHERE nombre LIKE ? LIMIT 1',
      [`%${fuenteText}%`]
    );
    return results.length > 0 ? results[0].id : null;
  } catch (error) {
    console.error('❌ Error buscando fuente:', error.message);
    return null;
  }
}

/**
 * Busca en la BD el clasificador_id basado en la partida extraída del PDF
 * @param {string} partida - Partida del clasificador (ej: "23.1.3.1.1")
 * @param {Connection} connection - Conexión MySQL
 * @returns {Promise<number|null>} ID del clasificador o null
 */
async function findClasificadorIdByPartida(partida, connection) {
  try {
    const [results] = await connection.query(
      'SELECT id FROM clasificadores WHERE partida = ? AND activo = 1 LIMIT 1',
      [partida]
    );
    return results.length > 0 ? results[0].id : null;
  } catch (error) {
    console.error('❌ Error buscando clasificador:', error.message);
    return null;
  }
}

/**
 * Convierte código de partida del PDF (2.3.1) al formato de BD (23.1)
 * @param {string} codigoPdf - Código del PDF (ej: "2.3.1")
 * @returns {string} Código en formato BD (ej: "23.1")
 */
function convertirCodigoPartida(codigoPdf) {
  // Eliminar puntos iniciales y reformatear
  const parts = codigoPdf.split('.');
  if (parts.length > 1) {
    // 2.3.1 -> 23.1
    // 2.3.1.3.1.1 -> 23.1.3.1.1
    return parts.slice(0, 1).concat(parts.slice(1)).join('.');
  }
  return codigoPdf;
}

/**
 * Extrae información de un PDF de Certificación de Crédito
 */
exports.extractCertificationPdf = async (req, res) => {
  try {
    let pdfBuffer;
    let pdfPath;
    
    // CASO 1: Archivo subido (multipart/form-data)
    if (req.file) {
      pdfBuffer = req.file.buffer;
      pdfPath = req.file.originalname;
      console.log('📤 PDF desde upload:', pdfPath);
    }
    // CASO 2: Ruta existente (application/json)
    else if (req.body.rutaPdf && req.body.procesarDesdeServidor) {
      const fs = require('fs');
      const path = require('path');
      
      // Construir ruta completa
      const rutaCompleta = path.join(__dirname, '..', req.body.rutaPdf);
      
      console.log('💾 PDF desde servidor:', rutaCompleta);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(rutaCompleta)) {
        return res.status(404).json({
          success: false,
          error: 'Archivo PDF no encontrado: ' + rutaCompleta
        });
      }
      
      // Leer archivo
      pdfBuffer = fs.readFileSync(rutaCompleta);
      pdfPath = path.basename(rutaCompleta);
      console.log('✅ PDF cargado desde disco:', pdfPath, '(' + pdfBuffer.length + ' bytes)');
    }
    else {
      return res.status(400).json({ 
        error: 'No se proporcionó archivo PDF o ruta válida' 
      });
    }

    const PDFParser = require('pdf2json');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    // Usar el directorio temporal del SO
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
    
    console.log('📝 Archivo temporal:', tempPath);
    fs.writeFileSync(tempPath, pdfBuffer);
    
    // Parsear PDF
    const pdfParser = new PDFParser(null, 1);
    
    const parsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout al procesar PDF'));
      }, 15000);
      
      pdfParser.on('pdfParser_dataError', err => {
        clearTimeout(timeout);
        reject(err);
      });
      pdfParser.on('pdfParser_dataReady', () => {
        clearTimeout(timeout);
        resolve(pdfParser);
      });
    });
    
    pdfParser.loadPDF(tempPath);
    const parser = await parsePromise;
    
    // Extraer texto de páginas
    let allText = '';
    if (parser.data && parser.data.Pages) {
      for (const page of parser.data.Pages) {
        if (page.Texts) {
          for (const text of page.Texts) {
            if (text.R && text.R[0]) {
              try {
                const decodedText = decodeURIComponent(text.R[0].T);
                allText += decodedText + ' ';
              } catch (e) {
                // Ignorar errores de decodificación
              }
            }
          }
        }
        allText += '\n';
      }
    }
    
    // Limpiar archivo temporal
    try {
      fs.unlinkSync(tempPath);
    } catch (e) {
      console.warn('⚠️  No se pudo eliminar archivo temporal:', tempPath);
    }
    
    const textUppercase = allText.toUpperCase();
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    console.log('✓ PDF procesado:', parser.data?.Pages?.length || 0, 'páginas');
    console.log('📝 Primeros 100 caracteres:', allText.substring(0, 100).replace(/\n/g, ' '));

    // Extraer información del PDF
    const extractedData = {
      nota: extractNota(textUppercase),
      mes: extractMes(textUppercase),
      fecha_aprobacion: extractFechaAprobacion(textUppercase),
      fecha_documento: extractFechaDocumento(textUppercase),
      estado_certificacion: extractEstadoCertificacion(textUppercase),
      tipo_documento: extractTipoDocumento(textUppercase),
      numero_documento: extractNumeroDocumento(textUppercase),
      justificacion: extractJustificacion(textUppercase),
      monto_total: extractMontoTotal(textUppercase),
      
      // Información adicional para mapeo a BD
      meta_info: extractMetaInfo(allText),
      periodo: extractPeriodo(textUppercase), // ✅ Agregar período/año
      fuente_info: extractFuenteInfo(textUppercase),
      detalles_raw: extractDetails(allText),
      
      total_pages: parser.data?.Pages?.length || 0,
      raw_text: allText, // TEXTO COMPLETO para análisis
      extraction_method: 'pdf2json',
      extractedAt: new Date()
    };

    // 🔍 ENRIQUECER CON IDs DE BASE DE DATOS
    let connection = null;
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME,
      });

      console.log('✅ Conexión a BD establecida para enriquecimiento');

      // 1️⃣ Buscar meta_id (AHORA CON FILTRO POR PERIODO/AÑO)
      if (extractedData.meta_info && extractedData.meta_info.numero) {
        // Quitar UN cero inicial: "0072" -> "072"
        const metaNumero = extractedData.meta_info.numero.replace(/^0/, '');
        
        // ✅ Extraer el período (año) del PDF
        let periodoBusqueda = extractPeriodo(allText);
        if (!periodoBusqueda && extractedData.fecha_documento) {
          // Si no se extrae del texto, usar el año de la fecha_documento
          const partes = extractedData.fecha_documento.split('/');
          if (partes.length === 3) {
            periodoBusqueda = partes[2]; // DD/MM/YYYY -> YYYY
          }
        }
        
        // Si aún no tenemos período, usar el año actual como fallback
        if (!periodoBusqueda) {
          periodoBusqueda = new Date().getFullYear().toString();
          console.log(`⚠️  No se extrajo período, usando año actual: ${periodoBusqueda}`);
        }
        
        console.log(`🔍 Buscando meta con numero_meta = "${metaNumero}" Y periodo = "${periodoBusqueda}"`);
        
        // ✅ BUSCA POR NUMERO + PERIODO (para permitir metas con mismo número en años diferentes)
        const [metas] = await connection.query(
          'SELECT id, nombre, numero_meta, periodo FROM metas WHERE numero_meta = ? AND periodo = ? LIMIT 1',
          [metaNumero, periodoBusqueda]
        );
        
        if (metas.length > 0) {
          extractedData.meta_info.id = metas[0].id;
          extractedData.meta_info.periodo = metas[0].periodo;
          extractedData.meta_id = metas[0].id;
          console.log(`✅ Meta encontrada: ID=${metas[0].id} | Número=${metas[0].numero_meta} | Período=${metas[0].periodo}`);
        } else {
          console.log(`⚠️  Meta no encontrada para numero="${metaNumero}" en período "${periodoBusqueda}"`);
          // Intentar búsqueda alternativa: solo por número (último recurso)
          console.log(`   Intentando búsqueda alternativa: solo por número...`);
          const [metasAlternativa] = await connection.query(
            'SELECT id, nombre, numero_meta, periodo FROM metas WHERE numero_meta = ? ORDER BY periodo DESC LIMIT 1',
            [metaNumero]
          );
          if (metasAlternativa.length > 0) {
            console.log(`   ⚠️  Meta encontrada en período alternativo: ${metasAlternativa[0].periodo}`);
            extractedData.meta_info.id = metasAlternativa[0].id;
            extractedData.meta_info.periodo = metasAlternativa[0].periodo;
            extractedData.meta_id = metasAlternativa[0].id;
          }
        }
      }

      // 2️⃣ Buscar fuente_financiamiento completa
      if (extractedData.fuente_info) {
        console.log(`🔍 Buscando fuente con nombre LIKE "%${extractedData.fuente_info}%"`);
        const [fuentes] = await connection.query(
          'SELECT id, nombre FROM fuentes_financiamiento WHERE nombre LIKE ? LIMIT 1',
          [`%${extractedData.fuente_info}%`]
        );
        if (fuentes.length > 0) {
          extractedData.fuente_info_full = fuentes[0]; // { id, nombre }
          extractedData.fuente_financiamiento_id = fuentes[0].id;
          console.log(`✅ Fuente encontrada: ID=${fuentes[0].id}`);
        } else {
          console.log(`⚠️  Fuente no encontrada para "${extractedData.fuente_info}"`);
        }
      }

      // 3️⃣ Enriquecer detalles con clasificador_id
      if (extractedData.detalles_raw && Array.isArray(extractedData.detalles_raw)) {
        console.log(`🔍 Enriqueciendo ${extractedData.detalles_raw.length} detalles con clasificadores`);
        for (const detalle of extractedData.detalles_raw) {
          // Buscar clasificador por partida
          let [clasificadores] = await connection.query(
            'SELECT id, nombre FROM clasificadores WHERE partida = ? AND activo = 1 LIMIT 1',
            [detalle.partida_db]
          );
          
          // Si no existe, crear la partida automáticamente
          if (clasificadores.length === 0) {
            console.log(`  📝 Creando nueva partida: "${detalle.partida_db}" - ${detalle.descripcion}`);
            
            try {
              await connection.query(
                'INSERT INTO clasificadores (partida, nombre, descripcion, activo) VALUES (?, ?, ?, 1)',
                [
                  detalle.partida_db,
                  detalle.descripcion.substring(0, 100),
                  detalle.descripcion.substring(0, 200)
                ]
              );
              
              // Buscar el ID recién creado
              [clasificadores] = await connection.query(
                'SELECT id, nombre FROM clasificadores WHERE partida = ? AND activo = 1 LIMIT 1',
                [detalle.partida_db]
              );
              
              if (clasificadores.length > 0) {
                console.log(`  ✅ Partida creada con éxito | ID=${clasificadores[0].id}`);
              }
            } catch (insertError) {
              console.log(`  ❌ Error creando partida: ${insertError.message}`);
            }
          } else {
            console.log(`  ✅ Partida encontrada: "${detalle.partida_db}" | ID=${clasificadores[0].id}`);
          }
          
          if (clasificadores.length > 0) {
            detalle.clasificador_id = clasificadores[0].id;
            detalle.clasificador_nombre = clasificadores[0].nombre;
          }
        }
        console.log(`✅ Detalles enriquecidos`);
      }

      console.log('✅ Datos enriquecidos con IDs de BD');
    } catch (dbError) {
      console.warn('⚠️  Error enriqueciendo datos de BD:', dbError.message);
      // No lanzar error, continuar con datos sin enriquecer
    } finally {
      if (connection) {
        await connection.end();
      }
    }

    // Convertir fechas de DD/MM/YYYY a YYYY-MM-DD
    const convertirFecha = (fecha) => {
      if (!fecha) return '';
      const partes = fecha.split('/');
      if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
      return fecha;
    };

    extractedData.fecha_aprobacion = convertirFecha(extractedData.fecha_aprobacion);
    extractedData.fecha_documento = convertirFecha(extractedData.fecha_documento);

    res.json({
      success: true,
      data: extractedData
    });
  } catch (error) {
    console.error('❌ Error en extracción PDF:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Función auxiliar: Extrae NOTA (ej: 0000002658)
 */
function extractNota(text) {
  const pattern = /NOTA\s*N[°#]\s*(\d+)/i;
  const match = text.match(pattern);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Función auxiliar: Extrae MES (ej: Febrero)
 */
function extractMes(text) {
  const pattern = /MES:\s*([A-Za-záéíóúàèìòùäëïöüÁÉÍÓÚÀÈÌÒÙÄËÏÖÜ]+)/i;
  const match = text.match(pattern);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Función auxiliar: Extrae PERIODO (AÑO) del PDF
 * Busca el año en referencias a ejercicio fiscal o el año actual
 * Puede extraer de patrones como "2026", "EJERCICIO 2026", etc.
 */
function extractPeriodo(text) {
  // Estrategia 1: Buscar "EJERCICIO XXXX"
  let pattern = /EJERCICIO\s*(\d{4})/i;
  let match = text.match(pattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Estrategia 2: Buscar "PERÍODO XXXX" o "PERIODO XXXX"
  pattern = /PERÍODO[O]?\s*(?:FISCAL\s+)?(\d{4})/i;
  match = text.match(pattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Estrategia 3: Buscar "PRESUPUESTO XXXX" o "PRESUPUESTAL XXXX"
  pattern = /PRESUPUEST[A-Z]*\s+(\d{4})/i;
  match = text.match(pattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Estrategia 4: Buscar "AÑO XXXX" o "AÑO FISCAL XXXX"
  pattern = /AÑO\s+(?:FISCAL\s+)?(\d{4})/i;
  match = text.match(pattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Estrategia 5: Si nada funciona, retornar null (será reemplazado por la fecha)
  return null;
}

/**
 * Función auxiliar: Extrae FECHA_APROBACION (ej: 26/02/2026)
 */
function extractFechaAprobacion(text) {
  const pattern = /FECHA\s+APROBACION:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i;
  const match = text.match(pattern);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Función auxiliar: Extrae FECHA_DOCUMENTO (ej: 26/02/2026)
 */
function extractFechaDocumento(text) {
  const pattern = /FECHA\s+DE\s+DOCUMENTO:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i;
  const match = text.match(pattern);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Función auxiliar: Extrae ESTADO_CERTIFICACION (ej: APROBADO)
 */
function extractEstadoCertificacion(text) {
  const pattern = /ESTADO\s+CERTIFICACION:\s*([A-Z]+)/i;
  const match = text.match(pattern);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Función auxiliar: Extrae TIPO_DOCUMENTO (ej: MEMORANDUM)
 */
function extractTipoDocumento(text) {
  const pattern = /TIPO\s+DOCUMENTO:\s*([A-Z\s]+?)(?=N°|$)/i;
  const match = text.match(pattern);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Función auxiliar: Extrae NUMERO_DOCUMENTO (ej: 32716M329AAA.U)
 */
function extractNumeroDocumento(text) {
  // Capturar todo después de "N° DOCUMENTO:" hasta "JUSTIFICACIÓN"
  const pattern = /N°\s*DOCUMENTO:\s*(.+?)(?=JUSTIFICACIÓN|$)/i;
  const match = text.match(pattern);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Función auxiliar: Extrae JUSTIFICACION (ej: GASTOS OPERATIVOS AAA UCAYALI MARZO)
 */
function extractJustificacion(text) {
  const pattern = /JUSTIFICACIÓN:\s*([A-Z\s0-9-]+?)(?=NOTA|MONTO|$)/i;
  const match = text.match(pattern);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Función auxiliar: Extrae MONTO_TOTAL (ej: 20,540.00 o 20540.00)
 */
function extractMontoTotal(text) {
  // Busca el patrón "TOTAL NOTA:" seguido de un número
  const pattern = /TOTAL\s+NOTA:\s*([\d,]+\.?\d*)/i;
  const match = text.match(pattern);
  
  if (match && match[1]) {
    // Limpia el monto: remueve comas y convierte a número
    const cleanAmount = match[1].replace(/,/g, '');
    return parseFloat(cleanAmount);
  }
  return 0;
}

/**
 * Extrae META (número y descripción) del PDF
 * El PDF text desde pdf2json viene en una sola línea
 * Busca específicamente "0072 GESTION OPERATIVA"
 */
function extractMetaInfo(text) {
  // La estrategia es buscar la sección de DETALLES
  // y extraer la META que aparece inmediatamente DESPUÉS de la línea donde termina la descripción
  // En el PDF típicamente viene como:
  // "0069 ATENCION AL USUARIO LOCAL DE AGUA" (esta es la meta correcta)
  // después de números y montos
  
  // Patrón: Buscar un número de 4 dígitos seguido de descripción en mayúsculas
  // Pero DESPUÉS de haber encontrado montos (que indican el inicio de detalles)
  
  const detailsStart = text.search(/\d+\.\d+/);
  if (detailsStart === -1) {
    // Si no hay detalles, buscar cualquier meta
    const pattern = /(\d{4})\s+([A-Z\s\-]+?)(?=\s+\d{1,}[\.,]|$)/;
    const match = text.match(pattern);
    if (match) {
      return {
        numero: match[1],
        descripcion: match[2].trim()
      };
    }
    return null;
  }
  
  // Buscar en la sección de detalles
  const detailsSection = text.substring(detailsStart);
  
  // Patrón: Número de 4 dígitos + descripción en mayúsculas
  // Ejemplo: "0069 ATENCION AL USUARIO LOCAL DE AGUA"
  const metaPattern = /(\d{4})\s+([A-Z][A-Z\s\-\']+?)(?=\s*(?:\d{1,3}[\.,]?\d+)|$)/;
  const match = detailsSection.match(metaPattern);
  
  if (match) {
    return {
      numero: match[1],
      descripcion: match[2].trim()
    };
  }
  
  return null;
}

/**
 * Extrae FUENTE DE FINANCIAMIENTO del PDF
 */
function extractFuenteInfo(text) {
  const fuentes = [
    'RECURSOS ORDINARIOS',
    'RECURSOS DIRECTAMENTE RECAUDADOS',
    'DONACIONES',
    'CRÉDITO PÚBLICO'
  ];
  
  for (const fuente of fuentes) {
    const pattern = new RegExp(`\\b${fuente}\\b`, 'i');
    if (pattern.test(text)) {
      return fuente;
    }
  }
  
  return null;
}

/**
 * Extrae DETALLES del PDF
 * Formato en PDF (una sola línea): "2.3. 1  COMPRA DE BIENES 600.00 2.3. 1 3  COMBUSTIBLES..."
 * IMPORTANTE: Solo extraer los detalles de MÁXIMO nivel (6 niveles con 12 caracteres)
 * Ej: "2.3. 1 3.1 1" -> "23. 1 3. 1 1" (12 caracteres exactos)
 */
function extractDetails(text) {
  const details = [];
  
  // Patrón mejorado para capturar TODAS las líneas:
  // Buscamos: (número.número[.número]+) + (espacios) + (DESCRIPCIÓN EN MAYÚS) + (espacios) + (monto con coma opcional)
  // El patrón debe ser flexible para capturar: "2.3. 1", "2.3. 1 3", "2.3. 1 3.1", "2.3. 1 3.1 1"
  // Patrón de monto: requiere EXACTAMENTE 2 decimales (ej: 600.00, 4,900.00, 800.00)
  // Nota: Sin lookahead para permitir capturar incluso el último detalle antes de TOTAL
  
  const detailPattern = /(\d+\.\d+(?:\.\s*\d+|\s+\d+)*)\s+([A-Z][A-Z\s,\-\']+?)\s+((?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2})/g;
  
  let match;
  const processedPartidas = new Set(); // Evitar duplicados
  
  while ((match = detailPattern.exec(text)) !== null) {
    const [, codigo, descripcion, monto] = match;
    
    if (!codigo || !descripcion || !monto) continue;
    
    // Normalizar código PDF
    // "2.3. 1" -> "2.3.1" 
    // "2.3. 2 1.2" -> "2.3.2.1.2" (con puntos)
    // "2.3. 1 3.1 1" -> "2.3.1.3.1.1"
    const codigoNormalized = codigo
      .replace(/\s+/g, '.') // Convertir espacios a puntos
      .replace(/\.+/g, '.') // Eliminar puntos duplicados
      .replace(/\.$/, ''); // Eliminar punto final si existe
    
    // Convertir código PDF a formato BD
    // "2.3.1.3.1.1" -> "23. 1 3. 1 1" (formato con espacios como en BD)
    // La BD usa espacios en formato: "23. X X. X X"
    const parts = codigoNormalized.split('.');
    
    let partida_db;
    if (parts.length === 6) {
      // 6 niveles: [2, 3, 1, 3, 1, 1] -> "23. 1 3. 1 1" (12 caracteres = DETALLE REAL)
      partida_db = parts[0] + parts[1] + '. ' + parts[2] + ' ' + parts[3] + '. ' + parts[4] + ' ' + parts[5];
    } else if (parts.length === 5) {
      // 5 niveles: [2, 3, 2, 1, 2] -> "23. 2 1. 2" (10 caracteres = NO GUARDAR)
      // Saltamos estos, solo procesamos los de 6 niveles
      continue;
    } else {
      // Otros niveles: NO procesar
      continue;
    }
    
    const montoValue = parseFloat(monto.replace(/,/g, ''));
    
    // Solo agregar si:
    // 1. Monto es válido (> 0)
    // 2. Descripción tiene longitud razonable
    // 3. No es un duplicado
    // 4. La partida_db tiene exactamente 12 caracteres
    if (montoValue > 0 && descripcion.length > 3 && !processedPartidas.has(partida_db) && partida_db.length === 12) {
      processedPartidas.add(partida_db);
      
      details.push({
        codigo_pdf: codigo.trim(),
        partida_db: partida_db,
        partida_completa: codigoNormalized, // Mostrar también el código completo normalizado
        descripcion: descripcion.trim(),
        monto: montoValue
      });
    }
  }
  
  return details;
}

/**
 * Función ANTIGUA: Extrae número de CCP (mantenida por compatibilidad)
 */
function extractNumber(text) {
  return extractNumeroDocumento(text);
}

/**
 * Función ANTIGUA: Extrae monto (mantenida por compatibilidad)
 */
function extractAmount(text) {
  return extractMontoTotal(text);
}

/**
 * Función ANTIGUA: Extrae beneficiario (mantenida por compatibilidad)
 */
function extractBeneficiary(lines) {
  // Por ahora retorna vacío, será implementado cuando indiques el patrón
  return '';
}

/**
 * Función ANTIGUA: Extrae concepto (mantenida por compatibilidad)
 */
function extractConcept(lines) {
  // Por ahora retorna vacío, será implementado cuando indiques el patrón
  return '';
}

/**
 * Función ANTIGUA: Extrae fecha (mantenida por compatibilidad)
 */
function extractDate(text) {
  return extractFechaDocumento(text);
}

/**
 * Función ANTIGUA: Extrae entidad (mantenida por compatibilidad)
 */
function extractEntity(text) {
  // Por ahora retorna vacío, será implementado cuando indiques el patrón
  return '';
}

/**
 * Guardar PDF asociado a una certificación
 * MÉTODO: Guardar en carpeta /uploads/certificaciones/
 */
exports.guardarCertificacionPdf = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    console.log('=== GUARDAR PDF EN CARPETA ===');
    console.log('Body:', req.body);
    console.log('File:', req.file ? { fieldname: req.file.fieldname, mimetype: req.file.mimetype, size: req.file.size } : 'NO FILE');
    
    const { certificacion_id } = req.body;
    const archivo = req.file;

    if (!archivo) {
      console.error('ERROR: No se proporcionó archivo PDF');
      return res.status(400).json({ 
        success: false, 
        error: 'No se proporcionó archivo PDF'
      });
    }

    if (!certificacion_id) {
      console.error('ERROR: No se proporcionó ID de certificación');
      return res.status(400).json({ 
        success: false, 
        error: 'No se proporcionó ID de certificación'
      });
    }

    // Validar MIME type
    if (archivo.mimetype !== 'application/pdf') {
      console.error('ERROR: Archivo no es PDF');
      return res.status(400).json({ 
        success: false, 
        error: 'Solo se permiten archivos PDF'
      });
    }

    // Validar tamaño máximo (100 MB)
    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
    if (archivo.size > MAX_SIZE) {
      console.error('ERROR: Archivo demasiado grande');
      return res.status(400).json({ 
        success: false, 
        error: `Archivo muy grande. Máximo permitido: 100 MB (actual: ${(archivo.size / 1024 / 1024).toFixed(2)} MB)`
      });
    }

    const { pool } = require('../config/database');

    // Crear nombre de archivo único
    const timestamp = Date.now();
    const ext = path.extname(archivo.originalname) || '.pdf';
    const nombreArchivo = `cert_${certificacion_id}_${timestamp}${ext}`;
    const rutaCarpeta = path.join(__dirname, '../uploads/certificaciones');
    const rutaCompleta = path.join(rutaCarpeta, nombreArchivo);

    // Asegurar que la carpeta existe
    if (!fs.existsSync(rutaCarpeta)) {
      fs.mkdirSync(rutaCarpeta, { recursive: true });
      console.log('✓ Carpeta creada:', rutaCarpeta);
    }

    // Guardar archivo en disco
    fs.writeFileSync(rutaCompleta, archivo.buffer);
    console.log('✓ Archivo guardado en disco:', rutaCompleta);

    // Actualizar la certificación con la ruta del archivo
    const rutaRelativa = `uploads/certificaciones/${nombreArchivo}`;
    const [result] = await pool.query(
      `UPDATE certificaciones_credito 
       SET ruta_archivo_pdf = ?, nombre_archivo_pdf = ? 
       WHERE id = ?`,
      [rutaRelativa, archivo.originalname, certificacion_id]
    );

    console.log('UPDATE result:', { affectedRows: result.affectedRows });

    if (result.affectedRows === 0) {
      // Eliminar archivo si no se pudo actualizar la BD
      fs.unlinkSync(rutaCompleta);
      console.error('ERROR: Certificación no encontrada con ID:', certificacion_id);
      return res.status(404).json({ 
        success: false, 
        error: 'Certificación no encontrada',
        certificacion_id
      });
    }

    console.log('✓ PDF guardado exitosamente para certificación:', certificacion_id);
    res.status(200).json({
      success: true,
      message: 'PDF guardado exitosamente',
      data: {
        certificacion_id,
        archivo_nombre: archivo.originalname,
        archivo_tamaño: `${(archivo.size / 1024).toFixed(2)} KB`,
        ruta_almacenamiento: rutaRelativa
      }
    });
  } catch (err) {
    console.error('ERROR CRÍTICO al guardar PDF:', err);
    res.status(500).json({
      success: false,
      error: `Error al guardar PDF: ${err.message}`,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * Descargar PDF de una certificación
 * MÉTODO: Leer desde carpeta /uploads/certificaciones/
 */
exports.descargarCertificacionPdf = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const { certificacion_id } = req.params;
    const { pool } = require('../config/database');

    const [resultado] = await pool.query(
      `SELECT ruta_archivo_pdf, nombre_archivo_pdf 
       FROM certificaciones_credito 
       WHERE id = ?`,
      [certificacion_id]
    );

    if (resultado.length === 0 || !resultado[0].ruta_archivo_pdf) {
      return res.status(404).json({ 
        success: false, 
        error: 'PDF no encontrado' 
      });
    }

    const { ruta_archivo_pdf, nombre_archivo_pdf } = resultado[0];
    const rutaCompleta = path.join(__dirname, '../', ruta_archivo_pdf);

    // Validar que el archivo existe
    if (!fs.existsSync(rutaCompleta)) {
      console.error('ERROR: Archivo no existe en:', rutaCompleta);
      return res.status(404).json({ 
        success: false, 
        error: 'Archivo no encontrado en el servidor' 
      });
    }

    // Leer archivo desde disco
    const archivo = fs.readFileSync(rutaCompleta);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre_archivo_pdf}"`);
    res.setHeader('Content-Length', archivo.length);
    res.send(archivo);
    
    console.log('✓ PDF descargado:', nombre_archivo_pdf);
  } catch (err) {
    console.error('Error descargando PDF:', err);
    res.status(500).json({
      success: false,
      error: `Error al descargar PDF: ${err.message}`
    });
  }
};
