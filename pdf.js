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

const penDropdown = document.getElementById('pen');
const penSizes = document.getElementById('pen-sizes');
penSizes.style.display = 'none';

let penSize = 1;
let pdfDoc = null;
let pageNum = 1;
let tool = 'pen';
let drawing = false;
let annotations = [];
let scale = 1;
let originalPageDimensions = {};


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

        // Store the original dimensions for each page
        for (let i = 1; i <= pdfData.numPages; i++) {
            const page = await pdfData.getPage(i);
            const viewport = page.getViewport({ scale: 1 });
            originalPageDimensions[i] = { width: viewport.width, height: viewport.height };
        }

        renderPDF(pdfData);
    };
    reader.readAsArrayBuffer(file);
});



zoomInButton.addEventListener('click', () => {
    scale += 0.25;
    renderPDF(pdfData);
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


function changeCursorStyle(cursor) {
    annotationCanvas.style.cursor = cursor;
}

penButton.addEventListener('click', () => {
    tool = 'pen';
    changeCursorStyle('crosshair');
});
highlighterButton.addEventListener('click', () => {
    tool = 'highlighter';
    changeCursorStyle('crosshair');
});

eraserButton.addEventListener('click', () => {
    tool = 'eraser';
    changeCursorStyle('crosshair');
});

penDropdown.addEventListener('click', () => {
    penSizes.style.display = penSizes.style.display === 'block' ? 'none' : 'block';
});

penSizes.addEventListener('click', (e) => {
    e.preventDefault();
    if (e.target.tagName === 'A') {
        penSize = parseInt(e.target.dataset.size);
        tool = 'pen';
    }
});

document.addEventListener('click', (e) => {
    if (!penDropdown.contains(e.target) && e.target !== penDropdown) {
        penSizes.style.display = 'none';
    }
});

document.querySelectorAll('#pen-sizes a').forEach((sizeOption) => {
    sizeOption.addEventListener('click', (e) => {
        e.preventDefault();
        penSize = parseInt(sizeOption.dataset.size, 10);
    });
});

annotationCanvas.addEventListener('mousedown', (e) => {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!annotations[pageNum]) {
        annotations[pageNum] = [];
    }

    if (tool === 'eraser') {
        eraseAnnotations(x, y, 10); // Erase annotations within a radius of 10 pixels
    } else {
        annotations[pageNum].push({ tool, penSize, points: [{ x, y }] });
    }
});

annotationCanvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const currentAnnotation = annotations[pageNum][annotations[pageNum].length - 1];

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

    if (!annotations[pageNum]) return; // Return if no annotations for the current page

    for (const annotation of annotations[pageNum]) {
        const { tool, penSize, points } = annotation;
        annotationContext.lineWidth = tool === 'pen' ? penSize * scale : 10 * scale;
        annotationContext.strokeStyle = tool === 'highlighter' ? 'rgba(255, 255, 0, 0.5)' : 'black';
        annotationContext.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        annotationContext.beginPath();
        annotationContext.moveTo(points[0].x * scale, points[0].y * scale);

        for (const point of points) {
            annotationContext.lineTo(point.x * scale, point.y * scale);
        }
        annotationContext.stroke();
    }
}

function eraseAnnotations(x, y, radius) {
    if (!annotations[pageNum]) return; // Return if no annotations for the current page

    annotations[pageNum] = annotations[pageNum].filter((annotation) => {
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

    renderAnnotations(); // Render annotations after the page is rendered
}

saveButton.addEventListener('click', async () => {
    if (!pdfData) {
        noPdfMessage.style.display = 'block';
        return;
    }

    const pdf = new jsPDF('p', 'pt', [originalPageDimensions[1].width, originalPageDimensions[1].height]);

    for (let i = 1; i <= pdfData.numPages; i++) {
        await renderPageToCanvas(i, 1); // Render at original scale

        const tempCanvas = document.createElement('canvas');
        const { width, height } = originalPageDimensions[i];
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempContext = tempCanvas.getContext('2d');
        tempContext.drawImage(canvas, 0, 0, width, height);

        // Draw the annotations on the temporary canvas
        if (annotations[i]) {
            for (const annotation of annotations[i]) {
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
        }

        if (i > 1) {
            pdf.addPage([width, height]);
        }

        pdf.addImage(tempCanvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
    }

    pdf.save('annotated.pdf');
});

async function renderPageToCanvas(pageNumber, customScale) {
    const page = await pdfData.getPage(pageNumber);
    const viewport = page.getViewport({ scale: customScale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    annotationCanvas.width = viewport.width;
    annotationCanvas.height = viewport.height;

    const renderContext = {
        canvasContext: context,
        viewport: viewport,
    };

    await page.render(renderContext).promise;
    renderAnnotations(); // Render annotations after the page is rendered
}






