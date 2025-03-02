const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('pdf-canvas');
const context = canvas.getContext('2d');
const annotationCanvas = document.getElementById('annotation-canvas');
const annotationContext = annotationCanvas.getContext('2d');
const CanvasWrapper = document.getElementById('canvas-wrapper');
const pageCounter = document.getElementById('page-counter');
const zoomLevel = document.getElementById('zoom-level');
const scrollIndicator = document.getElementById('scroll-indicator');

const penButton = document.getElementById('pen');
const highlighterButton = document.getElementById('highlighter');
const textButton = document.getElementById('text');
const eraserButton = document.getElementById('eraser');
const penColorPicker = document.getElementById('pen-color');
const highlighterColorPicker = document.getElementById('highlighter-color');
const textColorPicker = document.getElementById('text-color');
const sizeSlider = document.getElementById('size-slider');
const sizeControlPanel = document.getElementById('size-control-panel');
const sizePreviewDot = document.getElementById('size-preview-dot');
const sizeValue = document.getElementById('size-value');
const saveButton = document.getElementById('save');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const fitToWidthButton = document.getElementById('fit-to-width');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const clearAnnotationsButton = document.getElementById('clear-annotations');
const helpButton = document.getElementById('help-button');
const toolbarToggle = document.getElementById('toolbar-toggle');
const toolbar = document.getElementById('toolbar');

// Text annotation elements
const textModal = document.getElementById('text-modal');
const closeModal = document.querySelector('.close-modal');
const textInput = document.getElementById('text-input');
const fontSizeSelect = document.getElementById('font-size');
const fontFamilySelect = document.getElementById('font-family');
const addTextBtn = document.getElementById('add-text-btn');

// Shortcuts modal elements
const shortcutsModal = document.getElementById('shortcuts-modal');
const closeButtons = document.querySelectorAll('.close-modal');

const noPdfMessage = document.getElementById('no-pdf-message');

// Add these new constants for the quality modal
const saveQualityModal = document.getElementById('save-quality-modal');
const saveWithQualityButton = document.getElementById('save-with-quality');
const cancelSaveButton = document.getElementById('cancel-save');
const qualityOptions = document.getElementsByName('quality');

let tool = 'pen';
let penSize = 1;
let penColor = '#000000';
let highlighterColor = '#ffff00';
let textColor = '#000000';
let pdfDoc = null;
let pageNum = 1;
let totalPages = 1;
let drawing = false;
let annotations = [];
let textAnnotations = [];
let scale = 1;
let originalPageDimensions = {};
let textPosition = { x: 0, y: 0 };

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
    // Show the canvas wrapper immediately to ensure it has dimensions
    CanvasWrapper.style.display = 'block';

    const reader = new FileReader();
    reader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target.result);
        pdfData = await pdfjsLib.getDocument({ data: typedArray }).promise;
        totalPages = pdfData.numPages;
        pageNum = 1;
        updatePageCounter();

        // Store the original dimensions for each page
        for (let i = 1; i <= pdfData.numPages; i++) {
            const page = await pdfData.getPage(i);
            const viewport = page.getViewport({ scale: 1 });
            originalPageDimensions[i] = { width: viewport.width, height: viewport.height };
        }

        // Render the PDF first with default scale
        await renderPDF(pdfData);
        
        // Then fit to width after a delay to ensure everything is properly rendered
        setTimeout(() => {
            fitToWidth();
        }, 300);
    };
    reader.readAsArrayBuffer(file);
});

zoomInButton.addEventListener('click', () => {
    scale += 0.25;
    fitToWidthButton.classList.remove('active');
    updateZoomLevel();
    renderPDF(pdfData);
});

zoomOutButton.addEventListener('click', () => {
    scale = Math.max(0.5, scale - 0.25);
    fitToWidthButton.classList.remove('active');
    updateZoomLevel();
    renderPDF(pdfData);
});

prevPageButton.addEventListener('click', () => {
    if (pageNum <= 1) return; // Prevent going below the first page
    pageNum--;
    updatePageCounter();
    renderPDF(pdfData);
});

nextPageButton.addEventListener('click', async () => {
    if (!pdfData) return; // Prevent going beyond the last page if pdfData is not available
    const numPages = pdfData.numPages;
    if (pageNum >= numPages) return;
    pageNum++;
    updatePageCounter();
    renderPDF(pdfData);
});

function updatePageCounter() {
    if (pdfData) {
        pageCounter.textContent = `Page ${pageNum} of ${totalPages}`;
    } else {
        pageCounter.textContent = 'Page 1 of 1';
    }
}

// Function to set active tool button
function setActiveTool(activeButton) {
    // For zoom buttons, we handle them separately
    if (activeButton === fitToWidthButton) {
        fitToWidthButton.classList.add('active');
        return;
    }
    
    // Remove active class from fit-to-width button
    fitToWidthButton.classList.remove('active');
    
    // Remove active class from all tool buttons
    const toolButtons = document.querySelectorAll('.tool-button');
    toolButtons.forEach(button => button.classList.remove('active'));
    
    // Add active class to the selected button
    activeButton.classList.add('active');
}

penButton.addEventListener('click', (e) => {
    tool = 'pen';
    setActiveTool(penButton);
    showSizeControlPanel();
    updateSizePreview();
    changeCursorStyle('crosshair');
});

highlighterButton.addEventListener('click', (e) => {
    tool = 'highlighter';
    setActiveTool(highlighterButton);
    showSizeControlPanel();
    updateSizePreview();
    changeCursorStyle('crosshair');
});

textButton.addEventListener('click', () => {
    tool = 'text';
    setActiveTool(textButton);
    hideSizeControlPanel();
    changeCursorStyle('text');
});

eraserButton.addEventListener('click', (e) => {
    tool = 'eraser';
    setActiveTool(eraserButton);
    showSizeControlPanel();
    updateSizePreview();
    changeCursorStyle('crosshair');
});

// Set pen as the default active tool when the page loads
window.addEventListener('DOMContentLoaded', () => {
    setActiveTool(penButton);
    updateZoomLevel();
    addShortcutTooltips();
    
    // Initialize the size control panel
    showSizeControlPanel();
    updateSizePreview();
    
    // Initialize toolbar toggle
    initToolbarToggle();
});

penColorPicker.addEventListener('input', (e) => {
    penColor = e.target.value;
    if (tool === 'pen') {
        updateSizePreview();
    }
});

highlighterColorPicker.addEventListener('input', (e) => {
    highlighterColor = e.target.value;
    if (tool === 'highlighter') {
        updateSizePreview();
    }
});

textColorPicker.addEventListener('input', (e) => {
    textColor = e.target.value;
});

clearAnnotationsButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all annotations on this page?')) {
        if (annotations[pageNum]) {
            annotations[pageNum] = [];
            if (textAnnotations[pageNum]) {
                textAnnotations[pageNum] = [];
            }
            renderAnnotations();
            renderTextAnnotations();
        }
    }
});

document.addEventListener('click', (e) => {
    // We don't need to hide the size control panel on click outside anymore
    // as it's now a permanent part of the UI when a drawing tool is selected
});

sizeSlider.addEventListener('input', () => {
    penSize = sizeSlider.value;
    updateSizePreview();
});

annotationCanvas.addEventListener('mousedown', (e) => {
    if (tool === 'text') {
        const rect = canvas.getBoundingClientRect();
        textPosition.x = (e.clientX - rect.left) / scale;
        textPosition.y = (e.clientY - rect.top) / scale;
        textModal.style.display = 'block';
        textInput.focus();
        return;
    }

    drawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (!annotations[pageNum]) {
        annotations[pageNum] = [];
    }

    if (tool === 'eraser') {
        eraseAnnotations(x, y, penSize / scale);
    } else {
        const color = tool === 'pen' ? penColor : highlighterColor;
        annotations[pageNum].push({ tool, penSize, color, points: [{ x, y }] });
    }
});

annotationCanvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const currentAnnotation = annotations[pageNum][annotations[pageNum].length - 1];

    if (tool === 'eraser') {
        eraseAnnotations(x, y, penSize / scale);
    } else {
        currentAnnotation.points.push({ x, y });
        renderAnnotations();
    }
});

annotationCanvas.addEventListener('mouseup', () => drawing = false);

// Text annotation modal handling is now handled by the unified modal close handlers

addTextBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text) {
        addTextAnnotation(text, textPosition.x, textPosition.y);
        textModal.style.display = 'none';
        textInput.value = '';
    }
});

function addTextAnnotation(text, x, y) {
    if (!textAnnotations[pageNum]) {
        textAnnotations[pageNum] = [];
    }

    const fontSize = parseInt(fontSizeSelect.value);
    const fontFamily = fontFamilySelect.value;

    textAnnotations[pageNum].push({
        text,
        x,
        y,
        fontSize,
        fontFamily,
        color: textColor
    });

    renderTextAnnotations();
}

function renderTextAnnotations() {
    // Remove existing text annotations from DOM
    const existingTextAnnotations = document.querySelectorAll('.text-annotation');
    existingTextAnnotations.forEach(el => el.remove());

    if (!textAnnotations[pageNum]) return;

    const canvasContainer = document.querySelector('.canvas-container');

    textAnnotations[pageNum].forEach((annotation, index) => {
        const textElement = document.createElement('div');
        textElement.className = 'text-annotation';
        textElement.textContent = annotation.text;
        
        textElement.style.left = `${annotation.x * scale}px`;
        textElement.style.top = `${annotation.y * scale}px`;
        
        textElement.style.fontSize = `${annotation.fontSize * scale}px`;
        textElement.style.fontFamily = annotation.fontFamily;
        textElement.style.color = annotation.color;
        textElement.dataset.index = index;

        // Make text annotations draggable
        textElement.addEventListener('mousedown', startDragText);

        canvasContainer.appendChild(textElement);
    });
}

function startDragText(e) {
    const textElement = e.target;
    const index = parseInt(textElement.dataset.index);
    
    let startX = e.clientX;
    let startY = e.clientY;
    
    function moveText(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        textAnnotations[pageNum][index].x += dx / scale;
        textAnnotations[pageNum][index].y += dy / scale;
        
        textElement.style.left = `${textAnnotations[pageNum][index].x * scale}px`;
        textElement.style.top = `${textAnnotations[pageNum][index].y * scale}px`;
        
        startX = e.clientX;
        startY = e.clientY;
    }
    
    function stopDragText() {
        document.removeEventListener('mousemove', moveText);
        document.removeEventListener('mouseup', stopDragText);
    }
    
    document.addEventListener('mousemove', moveText);
    document.addEventListener('mouseup', stopDragText);
    
    e.preventDefault(); // Prevent text selection during drag
}

async function renderPDF(pdfDoc) {
    if (!pdfDoc) return;
    
    // Ensure scale is valid
    if (scale <= 0 || isNaN(scale)) {
        console.log("Invalid scale detected:", scale);
        scale = 1; // Reset to default if invalid
        updateZoomLevel();
    }
    
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    annotationCanvas.width = viewport.width;
    annotationCanvas.height = viewport.height;

    // Update the canvas container size to match the viewport
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.style.width = `${viewport.width}px`;
    canvasContainer.style.height = `${viewport.height}px`;

    const renderContext = {
        canvasContext: context,
        viewport: viewport,
    };
    await page.render(renderContext).promise;

    // Show the canvases when a PDF is loaded
    CanvasWrapper.style.display = 'block';

    // Hide the no-pdf-message when a PDF is loaded
    noPdfMessage.style.display = 'none';

    renderAnnotations(); // Render annotations after the page is rendered
    renderTextAnnotations(); // Render text annotations
    
    // Scroll to the top when changing pages or zoom
    CanvasWrapper.scrollTop = 0;
    CanvasWrapper.scrollLeft = 0;
    
    // Check if scrolling is needed and show indicator
    checkScrollNeeded();
}

function renderAnnotations() {
    annotationContext.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);

    if (!annotations[pageNum]) return; // Return if no annotations for the current page

    for (const annotation of annotations[pageNum]) {
        const { tool, penSize, color, points } = annotation;
        annotationContext.lineWidth = penSize * scale;
        
        if (tool === 'highlighter') {
            annotationContext.strokeStyle = color || 'rgba(255, 255, 0, 0.3)';
            annotationContext.globalAlpha = 0.3;
        } else {
            annotationContext.strokeStyle = color || 'black';
            annotationContext.globalAlpha = 1.0;
        }
        
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

// Update the save button click handler
saveButton.addEventListener('click', () => {
    if (!pdfData) {
        noPdfMessage.style.display = 'block';
        return;
    }
    
    // Show the quality settings modal
    saveQualityModal.style.display = 'block';
});

// Handle save with selected quality
saveWithQualityButton.addEventListener('click', async () => {
    // Get the selected quality
    let selectedDPI = 150; // Default
    for (const option of qualityOptions) {
        if (option.checked) {
            selectedDPI = parseInt(option.value);
            break;
        }
    }
    
    // Hide the quality modal
    saveQualityModal.style.display = 'none';
    
    // Show a loading message or spinner
    const loadingMessage = document.createElement('div');
    loadingMessage.style.position = 'fixed';
    loadingMessage.style.top = '50%';
    loadingMessage.style.left = '50%';
    loadingMessage.style.transform = 'translate(-50%, -50%)';
    loadingMessage.style.padding = '20px';
    loadingMessage.style.background = 'rgba(0, 0, 0, 0.7)';
    loadingMessage.style.color = 'white';
    loadingMessage.style.borderRadius = '8px';
    loadingMessage.style.zIndex = '9999';
    loadingMessage.textContent = `Generating ${selectedDPI} DPI PDF...`;
    document.body.appendChild(loadingMessage);

    try {
        // Calculate scale factor based on selected DPI
        const SCALE_FACTOR = selectedDPI / 72; // PDF default is 72 DPI

        // Create a PDF with the dimensions of the first page
        const pdf = new jsPDF('p', 'pt', [originalPageDimensions[1].width, originalPageDimensions[1].height]);

        // Process each page
        for (let i = 1; i <= pdfData.numPages; i++) {
            // Get the original page dimensions
            const { width, height } = originalPageDimensions[i];
            
            // Create a high-resolution canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width * SCALE_FACTOR;
            tempCanvas.height = height * SCALE_FACTOR;
            const tempContext = tempCanvas.getContext('2d');
            
            // Set high-quality rendering
            tempContext.imageSmoothingEnabled = true;
            tempContext.imageSmoothingQuality = 'high';
            
            // Render the PDF page at high resolution
            const page = await pdfData.getPage(i);
            const viewport = page.getViewport({ scale: SCALE_FACTOR });
            
            // Render the PDF content to the canvas
            await page.render({
                canvasContext: tempContext,
                viewport: viewport
            }).promise;
            
            // Draw the annotations on the high-resolution canvas
            if (annotations[i]) {
                for (const annotation of annotations[i]) {
                    // Scale the line width appropriately
                    tempContext.lineWidth = annotation.penSize * SCALE_FACTOR;
                    
                    if (annotation.tool === 'highlighter') {
                        tempContext.strokeStyle = annotation.color || 'rgba(255, 255, 0, 0.3)';
                        tempContext.globalAlpha = 0.3;
                    } else {
                        tempContext.strokeStyle = annotation.color || 'black';
                        tempContext.globalAlpha = 1.0;
                    }
                    
                    tempContext.globalCompositeOperation = annotation.tool === 'eraser' ? 'destination-out' : 'source-over';
                    tempContext.beginPath();

                    // Scale all points to the high-resolution canvas
                    const [firstPoint, ...remainingPoints] = annotation.points;
                    tempContext.moveTo(firstPoint.x * SCALE_FACTOR, firstPoint.y * SCALE_FACTOR);

                    for (const point of remainingPoints) {
                        tempContext.lineTo(point.x * SCALE_FACTOR, point.y * SCALE_FACTOR);
                    }

                    tempContext.stroke();
                }
            }

            // Draw text annotations
            if (textAnnotations[i]) {
                tempContext.globalAlpha = 1.0;
                tempContext.globalCompositeOperation = 'source-over';
                
                for (const annotation of textAnnotations[i]) {
                    // Scale font size for high resolution
                    const scaledFontSize = annotation.fontSize * SCALE_FACTOR;
                    tempContext.font = `${scaledFontSize}px ${annotation.fontFamily}`;
                    tempContext.fillStyle = annotation.color;
                    tempContext.fillText(
                        annotation.text, 
                        annotation.x * SCALE_FACTOR, 
                        annotation.y * SCALE_FACTOR
                    );
                }
            }

            // Add a new page for each page after the first
            if (i > 1) {
                pdf.addPage([width, height]);
            }

            // Add the high-quality image to the PDF
            // Use higher quality settings for the image
            const imgData = tempCanvas.toDataURL('image/jpeg', 1.0); // Use maximum quality JPEG
            pdf.addImage(imgData, 'JPEG', 0, 0, width, height, null, 'FAST');
        }

        // Save the PDF with a timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        pdf.save(`annotated-${timestamp}.pdf`);
    } catch (error) {
        console.error('Error saving PDF:', error);
        alert('An error occurred while saving the PDF. Please try again.');
    } finally {
        // Remove the loading message
        document.body.removeChild(loadingMessage);
    }
});

// Cancel save button
cancelSaveButton.addEventListener('click', () => {
    saveQualityModal.style.display = 'none';
});

// Close quality modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === saveQualityModal) {
        saveQualityModal.style.display = 'none';
    }
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

function changeCursorStyle(cursor) {
    annotationCanvas.style.cursor = cursor;
}

function showSizeControlPanel() {
    sizeControlPanel.classList.add('visible');
    sizeSlider.value = penSize;
    updateSizePreview();
}

function hideSizeControlPanel() {
    sizeControlPanel.classList.remove('visible');
}

function updateSizePreview() {
    // Update the size value text
    sizeValue.textContent = penSize;
    
    // Update the preview dot size
    const dotSize = Math.max(2, penSize * 2); // Scale up for better visibility
    sizePreviewDot.style.width = `${dotSize}px`;
    sizePreviewDot.style.height = `${dotSize}px`;
    
    // Update the preview dot color based on the selected tool
    if (tool === 'pen') {
        sizePreviewDot.style.backgroundColor = penColor;
    } else if (tool === 'highlighter') {
        sizePreviewDot.style.backgroundColor = highlighterColor;
        sizePreviewDot.style.opacity = '0.3';
    } else if (tool === 'eraser') {
        sizePreviewDot.style.backgroundColor = '#ffffff';
        sizePreviewDot.style.border = '1px solid #000000';
    }
}

function updateZoomLevel() {
    // Ensure scale is positive before displaying
    const displayScale = Math.max(scale, 0.01);
    zoomLevel.textContent = `${Math.round(displayScale * 100)}%`;
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Only process shortcuts if a PDF is loaded
    if (!pdfData) return;
    
    // Don't process shortcuts if user is typing in a text field
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    
    switch (e.key) {
        // Tool shortcuts
        case 'p': // Pen tool
            tool = 'pen';
            setActiveTool(penButton);
            showSizeControlPanel();
            updateSizePreview();
            changeCursorStyle('crosshair');
            break;
        case 'h': // Highlighter tool
            tool = 'highlighter';
            setActiveTool(highlighterButton);
            showSizeControlPanel();
            updateSizePreview();
            changeCursorStyle('crosshair');
            break;
        case 't': // Text tool
            tool = 'text';
            setActiveTool(textButton);
            hideSizeControlPanel();
            changeCursorStyle('text');
            break;
        case 'e': // Eraser tool
            tool = 'eraser';
            setActiveTool(eraserButton);
            showSizeControlPanel();
            updateSizePreview();
            changeCursorStyle('crosshair');
            break;
            
        // Navigation shortcuts
        case 'ArrowLeft': // Previous page
            if (pageNum > 1) {
                pageNum--;
                updatePageCounter();
                renderPDF(pdfData);
            }
            break;
        case 'ArrowRight': // Next page
            if (pageNum < totalPages) {
                pageNum++;
                updatePageCounter();
                renderPDF(pdfData);
            }
            break;
            
        // Zoom shortcuts
        case '+': // Zoom in
        case '=': // Also zoom in (= is the unshifted + key)
            scale += 0.25;
            fitToWidthButton.classList.remove('active');
            updateZoomLevel();
            renderPDF(pdfData);
            break;
        case '-': // Zoom out
            scale = Math.max(0.5, scale - 0.25);
            fitToWidthButton.classList.remove('active');
            updateZoomLevel();
            renderPDF(pdfData);
            break;
        case 'w': // Fit to width
            fitToWidthButton.click();
            break;
            
        // Save shortcut
        case 's': // Save if Ctrl/Cmd is pressed
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault(); // Prevent browser's save dialog
                saveButton.click(); // This now opens the quality modal
            }
            break;
            
        // Toggle toolbar
        case 'f': // Toggle toolbar
            toggleToolbar();
            break;
            
        default:
            return; // Exit for unhandled keys
    }
});

// Add a tooltip to show keyboard shortcuts
function addShortcutTooltips() {
    penButton.title = "Pen Tool (P)";
    highlighterButton.title = "Highlighter Tool (H)";
    textButton.title = "Text Tool (T)";
    eraserButton.title = "Eraser Tool (E)";
    zoomInButton.title = "Zoom In (+)";
    zoomOutButton.title = "Zoom Out (-)";
    fitToWidthButton.title = "Fit to Width (W)";
    prevPageButton.title = "Previous Page (Left Arrow)";
    nextPageButton.title = "Next Page (Right Arrow)";
    saveButton.title = "Save (Ctrl+S)";
}

// Help button click handler
helpButton.addEventListener('click', () => {
    shortcutsModal.style.display = 'block';
});

// Close buttons for all modals
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Find the parent modal and close it
        const modal = button.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
            
            // Clear text input if it's the text modal
            if (modal === textModal) {
                textInput.value = '';
            }
        }
    });
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === textModal) {
        textModal.style.display = 'none';
        textInput.value = '';
    } else if (e.target === shortcutsModal) {
        shortcutsModal.style.display = 'none';
    }
});

// Function to check if scrolling is needed and show/hide the indicator
function checkScrollNeeded() {
    // Wait a moment for the browser to calculate scroll dimensions
    setTimeout(() => {
        const isScrollableX = CanvasWrapper.scrollWidth > CanvasWrapper.clientWidth;
        const isScrollableY = CanvasWrapper.scrollHeight > CanvasWrapper.clientHeight;
        
        if (isScrollableX || isScrollableY) {
            scrollIndicator.classList.add('visible');
            
            // Hide the indicator after 3 seconds
            setTimeout(() => {
                scrollIndicator.classList.remove('visible');
            }, 3000);
        } else {
            scrollIndicator.classList.remove('visible');
        }
    }, 100);
}

// Show/hide scroll indicator when scrolling
CanvasWrapper.addEventListener('scroll', () => {
    scrollIndicator.classList.remove('visible');
});

// Add window resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
    // Debounce the resize event to avoid excessive rendering
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (pdfData && document.getElementById('fit-to-width').classList.contains('active')) {
            fitToWidth();
        }
    }, 200);
});

// Update the fitToWidth function to set the button as active
function fitToWidth() {
    if (!pdfData) return;
    
    // Calculate the scale needed to fit the PDF to the wrapper width
    // Account for some padding
    const padding = 40; // 20px padding on each side
    
    // Ensure the canvas wrapper has a valid width before calculating
    if (!CanvasWrapper.clientWidth) {
        // If wrapper isn't visible yet, try again after a short delay
        setTimeout(fitToWidth, 100);
        return;
    }
    
    const availableWidth = Math.max(CanvasWrapper.clientWidth - padding, 100); // Ensure minimum width
    const originalWidth = originalPageDimensions[pageNum].width;
    
    // Calculate the scale needed to fit the width
    let newScale = availableWidth / originalWidth;
    
    // Ensure scale is reasonable (not too small or negative)
    newScale = Math.max(newScale, 0.1); // Minimum scale of 10%
    
    // Round to 2 decimal places for cleaner display
    scale = Math.round(newScale * 100) / 100;
    
    // Set the fit-to-width button as active
    fitToWidthButton.classList.add('active');
    
    updateZoomLevel();
    renderPDF(pdfData);
}

// Fit to width button
fitToWidthButton.addEventListener('click', () => {
    fitToWidth();
});

// Toolbar toggle functionality
function initToolbarToggle() {
    toolbarToggle.addEventListener('click', toggleToolbar);
}

function toggleToolbar() {
    toolbar.classList.toggle('collapsed');
    
    // Update the toggle button icon
    const icon = toolbarToggle.querySelector('i');
    if (toolbar.classList.contains('collapsed')) {
        icon.className = 'fas fa-chevron-down';
        toolbarToggle.title = 'Show Toolbar';
    } else {
        icon.className = 'fas fa-chevron-up';
        toolbarToggle.title = 'Hide Toolbar';
    }
    
    // Adjust canvas wrapper height
    setTimeout(() => {
        if (pdfData) {
            checkScrollNeeded();
            if (fitToWidthButton.classList.contains('active')) {
                fitToWidth();
            }
        }
    }, 300);
}

// Initialize the UI
window.addEventListener('DOMContentLoaded', () => {
    setActiveTool(penButton);
    updateZoomLevel();
    addShortcutTooltips();
    
    // Initialize the size control panel
    showSizeControlPanel();
    updateSizePreview();
    
    // Initialize toolbar toggle
    initToolbarToggle();
});
