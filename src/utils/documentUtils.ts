import { Document, Paragraph, TextRun, Packer, AlignmentType } from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Extracts variables in the format {VariableName} from a string
 */
export const extractVariables = (template: string): string[] => {
  const regex = /\{([^}]+)\}/g;
  const matches = [...template.matchAll(regex)];
  // Use Set to get unique variables
  const uniqueVars = Array.from(new Set(matches.map(match => match[1])));
  return uniqueVars;
};

/**
 * Replaces placeholders {Key} with values from the provided record
 */
export const replaceVariables = (template: string, values: Record<string, string>): string => {
  return template.replace(/\{([^}]+)\}/g, (match, p1) => {
    return values[p1] || `[${p1}]`; // Placeholder for empty variables
  });
};

/**
 * Generates a high-quality PDF from an HTML element with multi-page support
 * and repeated header/footer
 */
export const generatePDF = async (elementId: string, filename: string = 'documento_sell.pdf') => {
  const element = document.getElementById(elementId);
  const header = document.getElementById(`${elementId}-header`);
  const content = document.getElementById(`${elementId}-content`);
  const footer = document.getElementById(`${elementId}-footer`);
  
  if (!element || !header || !content || !footer) {
    console.error('Required PDF elements not found');
    return;
  }

  try {
    // Wait for all images to load
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));

    const canvasOptions = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    };

    // Capture Header, Content and Footer separately
    const [headerCanvas, contentCanvas, footerCanvas] = await Promise.all([
      html2canvas(header, canvasOptions),
      html2canvas(content, canvasOptions),
      html2canvas(footer, canvasOptions)
    ]);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 20; // 20mm margin

    // Calculate heights in mm
    const headerHeight = (headerCanvas.height * (pdfWidth - 2 * margin)) / headerCanvas.width;
    const footerHeight = (footerCanvas.height * (pdfWidth - 2 * margin)) / footerCanvas.width;
    const contentWidth = pdfWidth - 2 * margin;
    const availableHeight = pdfHeight - headerHeight - footerHeight - (margin * 2.5); // Extra space for padding

    const contentHeightInMm = (contentCanvas.height * contentWidth) / contentCanvas.width;
    const imgDataHeader = headerCanvas.toDataURL('image/png');
    const imgDataContent = contentCanvas.toDataURL('image/png');
    const imgDataFooter = footerCanvas.toDataURL('image/png');

    let heightLeft = contentHeightInMm;
    let position = 0;
    let page = 1;

    while (heightLeft > 0) {
      if (page > 1) pdf.addPage();

      // 1. Add Content Slice (with offset)
      pdf.addImage(
        imgDataContent, 
        'PNG', 
        margin, 
        margin + headerHeight + 5 + position, 
        contentWidth, 
        contentHeightInMm
      );

      // 2. Cover Header Area with White Rect
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, margin + headerHeight + 2, 'F');

      // 3. Cover Footer Area with White Rect
      pdf.rect(0, pdfHeight - footerHeight - margin - 2, pdfWidth, footerHeight + margin + 2, 'F');

      // 4. Add Header (on top of content)
      pdf.addImage(imgDataHeader, 'PNG', margin, margin, contentWidth, headerHeight);

      // 5. Add Footer (on top of content)
      pdf.addImage(imgDataFooter, 'PNG', margin, pdfHeight - footerHeight - margin, contentWidth, footerHeight);

      heightLeft -= availableHeight;
      position -= availableHeight;
      page++;
    }
    
    // Download
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generates a Word document from Markdown text
 */
export const generateWord = async (text: string, filename: string = 'documento_sell.docx') => {
  const lines = text.split('\n');
  
  const paragraphs = lines.map(line => {
    // Basic bold/italic parsing
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    
    const textRuns = parts.map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({ text: part.slice(2, -2), bold: true });
      } else if (part.startsWith('*') && part.endsWith('*')) {
        return new TextRun({ text: part.slice(1, -1), italics: true });
      } else {
        return new TextRun({ text: part });
      }
    });

    return new Paragraph({ 
      children: textRuns,
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  try {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    console.error('Error generating Word:', error);
    throw error;
  }
};
