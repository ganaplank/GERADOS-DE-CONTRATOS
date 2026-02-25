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
 * and repeated header/footer. Uses a slicing technique to handle long content.
 */
export const generatePDF = async (elementId: string, filename: string = 'documento_sell.pdf') => {
  const element = document.getElementById(elementId);
  const header = document.getElementById(`${elementId}-header`);
  const content = document.getElementById(`${elementId}-content`);
  const footer = document.getElementById(`${elementId}-footer`);
  
  if (!element || !header || !content || !footer) {
    console.error('Required PDF elements not found');
    throw new Error('Required PDF elements not found');
  }

  try {
    // Wait for all images to load to avoid blank images in PDF
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if image fails
      });
    }));

    const canvasOptions = {
      scale: 2, // High quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    };

    // Capture Header, Content and Footer separately for better pagination control
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
    const contentWidth = pdfWidth - (2 * margin);

    // Calculate heights in mm relative to PDF width
    const headerHeight = (headerCanvas.height * contentWidth) / headerCanvas.width;
    const footerHeight = (footerCanvas.height * contentWidth) / footerCanvas.width;
    const contentHeightInMm = (contentCanvas.height * contentWidth) / contentCanvas.width;
    
    // Available height for content on each page
    // We leave some extra space (5mm) between sections
    const availableHeightPerPage = pdfHeight - headerHeight - footerHeight - (margin * 2) - 10;

    const imgDataHeader = headerCanvas.toDataURL('image/png');
    const imgDataContent = contentCanvas.toDataURL('image/png');
    const imgDataFooter = footerCanvas.toDataURL('image/png');

    let heightLeft = contentHeightInMm;
    let currentContentPosition = 0;
    let pageNumber = 1;

    while (heightLeft > 0) {
      if (pageNumber > 1) pdf.addPage();

      // 1. Add Content Slice first (it will be behind header/footer if they overlap)
      // We calculate where to place the big content image so the current "slice" is visible
      pdf.addImage(
        imgDataContent, 
        'PNG', 
        margin, 
        margin + headerHeight + 5 + currentContentPosition, 
        contentWidth, 
        contentHeightInMm
      );

      // 2. Cover Header Area with White Rect to prevent content bleed
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, margin + headerHeight + 2, 'F');

      // 3. Cover Footer Area with White Rect to prevent content bleed
      pdf.rect(0, pdfHeight - footerHeight - margin - 2, pdfWidth, footerHeight + margin + 2, 'F');

      // 4. Add Header (on top of the white rect)
      pdf.addImage(imgDataHeader, 'PNG', margin, margin, contentWidth, headerHeight);

      // 5. Add Footer (on top of the white rect)
      pdf.addImage(imgDataFooter, 'PNG', margin, pdfHeight - footerHeight - margin, contentWidth, footerHeight);

      // Update trackers
      heightLeft -= availableHeightPerPage;
      currentContentPosition -= availableHeightPerPage;
      pageNumber++;
    }
    
    // Final download
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

    // Memory cleanup
    headerCanvas.width = 0;
    headerCanvas.height = 0;
    contentCanvas.width = 0;
    contentCanvas.height = 0;
    footerCanvas.width = 0;
    footerCanvas.height = 0;

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
