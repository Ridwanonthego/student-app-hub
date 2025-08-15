import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadPdf = async (element: HTMLElement, personName: string) => {
    if (!element) return;

    // Temporarily set background to white for clean PDF export
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = 'white';

    const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        // Crucial for capturing content that overflows the viewport
        height: element.scrollHeight,
        windowHeight: element.scrollHeight,
    });
    
    // Restore original background color
    element.style.backgroundColor = originalBg;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const ratio = canvasWidth / pdfWidth;
    const pagedHeight = canvasHeight / ratio;
    
    let heightLeft = pagedHeight;
    let position = 0;

    // Add the first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pagedHeight);
    heightLeft -= pdfHeight;

    // Add more pages if content is taller than one page
    while (heightLeft > 0) {
        position -= pdfHeight; // Shift the image up for the next page
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pagedHeight);
        heightLeft -= pdfHeight;
    }
    
    pdf.save(`CV-${personName.replace(/\s+/g, '-') || 'Untitled'}.pdf`);
};