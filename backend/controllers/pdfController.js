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
