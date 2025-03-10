# PDF Annotation Tool

A user-friendly, in-browser PDF annotation tool that allows you to open, view, annotate, and save PDF files. Built with HTML, CSS, and JavaScript, and leveraging the PDF.js library for rendering and jsPDF for generating PDF documents.

## Features

- [x] Open and view PDFs in the browser
- [x] Pen, highlighter, text, and eraser annotation tools
- [x] Customizable drawing tools with size control and color options
- [x] Collapsible toolbar to maximize viewing area
- [x] Zoom, navigate, and save annotated PDFs with quality options
- [x] Keyboard shortcuts for all major functions
- [x] Responsive design for different screen sizes
- [x] AI-powered document processing (DeepSeek LLM integration)
  - [x] Text translation to multiple languages
  - [x] Document summarization
  - [x] Information extraction
  - [x] OCR for scanned documents (via Tesseract.js)
- [x] Intelligent text extraction with preserved formatting
- [x] User notifications system for operation feedback
- [x] Docker support for easy deployment and consistency

## Installation

### Standard Installation

Clone the repository and open the `index.html` file in a web browser:
```
git clone https://github.com/adiKhan12/pdf-annotator-javascript.git
cd pdf-annotation-tool
```

Then, open the `index.html` file in your preferred web browser.

### Docker Installation

If you have Docker installed, you can run the application in a container:

1. Clone the repository:
```
git clone https://github.com/adiKhan12/pdf-annotator-javascript.git
cd pdf-annotation-tool
```

2. Using Docker Compose (recommended):
```
docker-compose up -d
```

3. Or build and run with Docker directly:
```
docker build -t pdf-annotation-tool .
docker run -p 8080:80 pdf-annotation-tool
```

4. Access the application in your browser at `http://localhost:8080`

## Usage

1. Click the "Open PDF" button in the toolbar to select and open a PDF file.
2. Use the annotation tools:
   - **Pen Tool (P)**: Draw with customizable size and color
   - **Highlighter Tool (H)**: Highlight text with adjustable size and color
   - **Text Tool (T)**: Add text annotations with customizable font and color
   - **Eraser Tool (E)**: Remove annotations
3. Adjust drawing size using the size control panel
4. Navigate between pages using the navigation buttons or arrow keys
5. Zoom in/out or fit to width using the zoom controls
6. Toggle the toolbar visibility with the (F) key or the toggle button
7. Save the annotated PDF by clicking the "Save" button and selecting quality options

### AI Features

1. Access AI tools by clicking the respective buttons in the toolbar:
   - **Translate**: Translate selected text or entire pages to different languages
   - **Summarize**: Generate concise summaries of PDF content
   - **Extract Info**: Extract specific information from the document
2. Use OCR for scanned documents:
   - The tool automatically detects when a document needs OCR
   - Text extraction preserves original formatting and layout

## Keyboard Shortcuts

| Key | Function |
|-----|----------|
| P | Pen Tool |
| H | Highlighter Tool |
| T | Text Tool |
| E | Eraser Tool |
| ← | Previous Page |
| → | Next Page |
| + | Zoom In |
| - | Zoom Out |
| W | Fit to Width |
| F | Toggle Toolbar |
| L | Toggle AI Panel |
| Ctrl+S | Save PDF |

## Development

### Running for Development

For development, you can use the Docker setup with volumes to see your changes immediately:

```
docker-compose up
```

This will mount your local directory to the container, so any changes you make to the files will be reflected immediately in the browser.

### Building for Production

For production deployment:

```
docker build -t pdf-annotation-tool:production --no-cache .
docker run -p 80:80 pdf-annotation-tool:production
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

This is free and unencumbered software released into the public domain - see the [LICENSE](LICENSE) file for details 




