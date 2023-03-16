const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('pdf-canvas');
const context = canvas.getContext('2d');
const annotationCanvas = document.getElementById('annotation-canvas');
const annotationContext = annotationCanvas.getContext('2d');
const CanvasWrapper = document.getElementById('canvas-wrapper');

const penButton = document.getElementById('pen');
const highlighterButton = document.getElementById('highlighter');
const eraserButton = document.getElementById('eraser');
const saveButton = document.getElementById('save');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

const noPdfMessage = document.getElementById('no-pdf-message');


let pdfDoc = null;
let pageNum = 1;
let tool = 'pen';
let drawing = false;
let annotations = [];
let scale = 1;

annotationCanvas.width = canvas.width;
annotationCanvas.height = canvas.height;

const openPdfButton = document.getElementById('open-pdf');
openPdfButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        return;
    }

    noPdfMessage.style.display = 'none';

    const reader = new FileReader();
    reader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target.result);
        pdfData = await pdfjsLib.getDocument({ data: typedArray }).promise;
        renderPDF(pdfData);
    };
    reader.readAsArrayBuffer(file);
});



zoomInButton.addEventListener('click', () => {
    scale += 0.25;
    renderPDF(pdfData);
    console.log(scale);
});

zoomOutButton.addEventListener('click', () => {
    scale = Math.max(0.5, scale - 0.25);
    renderPDF(pdfData);
});

prevPageButton.addEventListener('click', () => {
    if (pageNum <= 1) return; // Prevent going below the first page
    pageNum--;
    renderPDF(pdfData);
});

nextPageButton.addEventListener('click', async () => {
    if (!pdfData) return; // Prevent going beyond the last page if pdfData is not available
    const numPages = pdfData.numPages;
    if (pageNum >= numPages) return;
    pageNum++;
    renderPDF(pdfData);
});



penButton.addEventListener('click', () => tool = 'pen');
highlighterButton.addEventListener('click', () => tool = 'highlighter');
eraserButton.addEventListener('click', () => tool = 'eraser');

annotationCanvas.addEventListener('mousedown', (e) => {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'eraser') {
        eraseAnnotations(x, y, 10); // Erase annotations within a radius of 10 pixels
    } else {
        annotations.push({ tool, points: [{ x, y }] });
    }
});

annotationCanvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const currentAnnotation = annotations[annotations.length - 1];

    if (tool === 'eraser') {
        eraseAnnotations(x, y, 10); // Erase annotations within a radius of 10 pixels
    } else {
        currentAnnotation.points.push({ x, y });
        renderAnnotations();
    }
});

annotationCanvas.addEventListener('mouseup', () => drawing = false);

async function renderPDF(pdfDoc) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    annotationCanvas.width = viewport.width;
    annotationCanvas.height = viewport.height;

    const renderContext = {
        canvasContext: context,
        viewport: viewport,
    };
    await page.render(renderContext).promise;

    // Show the canvases when a PDF is loaded
    CanvasWrapper.style.display = 'inline-block';

    // Hide the no-pdf-message when a PDF is loaded
    noPdfMessage.style.display = 'none';
}


function renderAnnotations() {
    annotationContext.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);

    for (const annotation of annotations) {
        const { tool, points } = annotation;
        annotationContext.lineWidth = tool === 'pen' ? 1 : 10;
        annotationContext.strokeStyle = tool === 'highlighter' ? 'rgba(255, 255, 0, 0.5)' : 'black';
        annotationContext.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        annotationContext.beginPath();
        annotationContext.moveTo(points[0].x, points[0].y);

        for (const point of points) {
            annotationContext.lineTo(point.x, point.y);
        }
        annotationContext.stroke();
    }
}

function eraseAnnotations(x, y, radius) {
    annotations = annotations.filter((annotation) => {
        for (const point of annotation.points) {
            if (
                Math.sqrt(
                    Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
                ) < radius
            ) {
                return false;
            }
        }
        return true;
    });

    renderAnnotations();
}

window.jsPDF = window.jspdf.jsPDF;

saveButton.addEventListener('click', async () => {
    const exportScale = 4; // Increase this value to improve the quality (e.g., 2, 3, or 4)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width * exportScale;
    tempCanvas.height = canvas.height * exportScale;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.scale(exportScale, exportScale);
    await renderPDF(pdfData);
    tempContext.drawImage(canvas, 0, 0);

    if (!pdfData) {
        noPdfMessage.style.display = 'block';
        return;
    }

    // Draw the annotations on the temporary canvas
    for (const annotation of annotations) {
        tempContext.strokeStyle = annotation.tool === 'pen' ? 'black' : 'yellow';
        tempContext.lineWidth = annotation.tool === 'pen' ? 3 : 10;
        tempContext.beginPath();

        const [firstPoint, ...remainingPoints] = annotation.points;
        tempContext.moveTo(firstPoint.x, firstPoint.y);

        for (const point of remainingPoints) {
            tempContext.lineTo(point.x, point.y);
        }

        tempContext.stroke();
    }

    const pdf = new jsPDF('p', 'pt', [tempCanvas.width, tempCanvas.height]);
    pdf.addImage(tempCanvas.toDataURL('image/png'), 'PNG', 0, 0, tempCanvas.width, tempCanvas.height);
    pdf.save('annotated.pdf');
});




