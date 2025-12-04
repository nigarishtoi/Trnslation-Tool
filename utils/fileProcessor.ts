// Declaration for window.pdfjsLib
declare global {
  interface Window {
    pdfjsLib: any;
    html2pdf: any;
  }
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const convertPdfToImages = async (file: File): Promise<string[]> => {
  if (!window.pdfjsLib) {
    throw new Error("PDF.js library not loaded");
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const images: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    images.push(canvas.toDataURL("image/jpeg", 0.8));
  }

  return images;
};

export const generateWordDocument = (htmlContent: string, fileName: string) => {
  const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
  const footer = "</body></html>";
  const sourceHTML = header + htmlContent + footer;

  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = `${fileName}_translated.doc`;
  fileDownload.click();
  document.body.removeChild(fileDownload);
};

export const generatePdfDocument = (elementId: string, fileName: string) => {
  if (!window.html2pdf) {
    alert("PDF generation library not loaded.");
    return;
  }
  const element = document.getElementById(elementId);
  const opt = {
    margin: 10,
    filename: `${fileName}_translated.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  window.html2pdf().set(opt).from(element).save();
};