const pdfParse = require('pdf-parse');
const fs = require('fs').promises;

/**
 * Extrae texto e información de un archivo PDF
 * @param {Buffer} pdfBuffer - Buffer del archivo PDF
 * @returns {Promise<Object>} Datos extraídos del PDF
 */
async function extractPdfData(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    
    // Extrae texto principal
    const text = data.text;
    
    // Estructura los datos extraídos
    const extractedData = {
      totalPages: data.numpages,
      text: text,
      metadata: data.metadata,
      info: data.info,
      lines: text.split('\n').filter(line => line.trim()),
      extractedAt: new Date()
    };

    return {
      success: true,
      data: extractedData
    };
  } catch (error) {
    console.error('Error extracting PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Procesa el PDF y extrae información de certificación
 * @param {Buffer} pdfBuffer - Buffer del archivo PDF
 * @returns {Promise<Object>} Datos procesados para la certificación
 */
async function processCertificationPdf(pdfBuffer) {
  try {
    const extracted = await extractPdfData(pdfBuffer);
    
    if (!extracted.success) {
      return extracted;
    }

    const text = extracted.data.text.toUpperCase();
    const lines = extracted.data.lines;

    // Intenta extraer información clave del PDF
    const certificacionData = {
      numero: extractNumber(text, 'CCP|NUMERO|Nº'),
      beneficiario: extractBeneficiary(lines),
      monto: extractAmount(text),
      concepto: extractConcept(lines),
      fecha: extractDate(text),
      resolving_entity: extractEntity(text),
      raw_text: extracted.data.text,
      pages: extracted.data.totalPages
    };

    return {
      success: true,
      data: certificacionData
    };
  } catch (error) {
    console.error('Error processing certification PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extrae número de CCP del texto
 */
function extractNumber(text, patterns) {
  const patternList = patterns.split('|');
  for (let pattern of patternList) {
    const regex = new RegExp(`${pattern}[\\s:]*([\\d-]+)`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

/**
 * Extrae beneficiario del texto
 */
function extractBeneficiary(lines) {
  const beneficiaryKeywords = ['beneficiario', 'acreedor', 'responsable', 'nombre'];
  for (let line of lines) {
    const upperLine = line.toUpperCase();
    for (let keyword of beneficiaryKeywords) {
      if (upperLine.includes(keyword)) {
        // Intenta sacar la siguiente línea o el mismo renglón
        const parts = line.split(keyword);
        if (parts.length > 1) {
          return parts[1].trim();
        }
      }
    }
  }
  return '';
}

/**
 * Extrae monto del texto
 */
function extractAmount(text) {
  const amountPatterns = [
    /S\/\.\s*([\d,]+\.?\d*)/i,
    /MONTO[:\s]*([\d,]+\.?\d*)/i,
    /CANTIDAD[:\s]*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*SOLES/i
  ];

  for (let pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  return 0;
}

/**
 * Extrae concepto del texto
 */
function extractConcept(lines) {
  const conceptKeywords = ['concepto', 'descripcion', 'asunto', 'motivo'];
  for (let i = 0; i < lines.length; i++) {
    const upperLine = lines[i].toUpperCase();
    for (let keyword of conceptKeywords) {
      if (upperLine.includes(keyword)) {
        // Intenta sacar las próximas líneas
        let concept = '';
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          if (lines[j].trim().length > 0) {
            concept += (concept ? ' ' : '') + lines[j].trim();
          }
        }
        return concept || lines[i];
      }
    }
  }
  return '';
}

/**
 * Extrae fecha del texto
 */
function extractDate(text) {
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
    /(\d{1,2})\s+DE\s+(\w+)\s+DE\s+(\d{4})/gi
  ];

  for (let pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      return match[0];
    }
  }
  return '';
}

/**
 * Extrae entidad responsable del texto
 */
function extractEntity(text) {
  const entityPatterns = [
    /ENTIDAD[:\s]*([A-Z\s&]+)/i,
    /INSTITUCION[:\s]*([A-Z\s&]+)/i,
    /EMITIDO POR[:\s]*([A-Z\s&]+)/i
  ];

  for (let pattern of entityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

module.exports = {
  extractPdfData,
  processCertificationPdf
};
