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

// Función para generar PDF de comisión (UNA PÁGINA POR COMISIONADO)
exports.generarPDFComision = async (req, res) => {
  try {
    const { comision_id } = req.params;
    const { comision_data, comisionado_id } = req.body;
    const fs = require('fs');
    const path = require('path');
    const PdfPrinter = require('pdfmake/src/printer');

    if (!comision_data) {
      return res.status(400).json({ error: "Datos de comisión requeridos" });
    }

    console.log("=== GENERANDO PDF CON PDFMAKE EN LANDSCAPE ===");

    // Definir fuentes
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

    const printer = new PdfPrinter(fonts);

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

    // Construir tabla de comisionados
    const tableRows = [
      [
        { text: 'COMISIONADO', style: 'tableHeader' },
        { text: 'CARGO', style: 'tableHeader' },
        { text: 'ACTIVIDAD', style: 'tableHeader' },
        { text: 'PARTIDA', style: 'tableHeader' },
        { text: 'DÍAS', style: 'tableHeader' },
        { text: 'FECHA SALIDA', style: 'tableHeader' },
        { text: 'FECHA RETORNO', style: 'tableHeader' },
        { text: 'MONTO (S/.)', style: 'tableHeader' },
      ]
    ];

    // Agregar filas
    comisionadosAMostrar.forEach(c => {
      tableRows.push([
        c.usuario_nombre || '',
        c.cargo_nombre || '',
        comision.observacion || '',
        comision.lugar || '',
        c.dias?.toString() || '0',
        new Date(c.fecha_salida).toLocaleDateString('es-ES'),
        new Date(c.fecha_retorno).toLocaleDateString('es-ES'),
        `S/. ${parseFloat(c.monto).toFixed(2)}`,
      ]);
    });

    // Definición del documento con LANDSCAPE
    const docDefinition = {
      pageOrientation: 'landscape',  // ✓ LANDSCAPE NATIVO EN PDFMAKE
      pageSize: 'A4',
      pageMargins: [25, 25, 25, 25],
      content: [
        // Logo placeholder
        { text: ambitoDelUsuario, fontSize: 9, marginBottom: 5 },
        { text: 'Oficina de Administración - Unidad de Recursos Humanos', fontSize: 8, marginBottom: 15 },

        // Títulos
        { text: 'ANEXO N° 01', alignment: 'center', fontSize: 11, bold: true, marginBottom: 3 },
        { text: 'PROGRAMACIÓN MENSUAL DE COMISIÓN DE SERVICIOS', alignment: 'center', fontSize: 10, bold: true, marginBottom: 15 },

        // Información
        { 
          columns: [
            { text: `DIRECCIÓN / OFICINA: ${ambitoDelUsuario}` },
            { text: `PERÍODO: ${new Date(comision.fecha_salida).toLocaleDateString('es-ES')} - ${new Date(comision.fecha_retorno).toLocaleDateString('es-ES')}`, alignment: 'right' }
          ],
          marginBottom: 10
        },

        // Tabla
        {
          table: {
            headerRows: 1,
            widths: ['12%', '10%', '18%', '18%', '6%', '9%', '9%', '18%'],
            body: tableRows
          },
          marginBottom: 15
        },

        // Firma
        { text: '', marginBottom: 40 },
        { text: 'FIRMA DEL JEFE O DIRECTOR', alignment: 'center', fontSize: 9, bold: true }
      ],
      styles: {
        tableHeader: {
          bold: true,
          fontSize: 8,
          color: 'white',
          fillColor: '#4F46E5',
          alignment: 'center',
          valign: 'middle'
        }
      },
      defaultStyle: {
        fontSize: 8,
        font: 'Helvetica'
      }
    };

    // Generar PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    // Configurar respuesta
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="comision_${comision_id}_${Date.now()}.pdf"`
    );

    console.log("✅ PDF LANDSCAPE generado con pdfmake");

    // Piping directo al response
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (err) {
    console.error("Error generando PDF:", err);
    res.status(500).json({ error: `Error al generar PDF: ${err.message}` });
  }
};
};
