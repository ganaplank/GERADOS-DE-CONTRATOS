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
 * Generates a high-quality PDF from an HTML element
 */
export const generatePDF = async (elementId: string, filename: string = 'documento_sell.pdf') => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error('Element not found:', elementId);
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

    // Capture with high scale for professional quality
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.style.transform = 'none';
          clonedElement.style.boxShadow = 'none';
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Download using blob to avoid iframe restrictions
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
