/**
 * LLM Service for DeepSeek API Integration
 * Handles translation, summarization, and information extraction
 */

// DeepSeek API configuration
const DEEPSEEK_API_KEY = 'DeepSeek API Key';
const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1';

// Available language options for translation
const LANGUAGE_OPTIONS = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
];

/**
 * Translates text to the specified language
 * @param {string} text - The text to translate
 * @param {string} targetLanguage - The language code to translate to
 * @returns {Promise<string>} - The translated text
 */
async function translateText(text, targetLanguage) {
    try {
        const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. Translate the following text to ${getLanguageName(targetLanguage)}. Provide only the translated text without any explanations or additional content.`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Translation error:', error);
        throw new Error(`Translation failed: ${error.message}`);
    }
}

/**
 * Summarizes text content
 * @param {string} text - The text to summarize
 * @param {number} maxLength - Maximum length of the summary in words
 * @returns {Promise<string>} - The summarized text
 */
async function summarizeContent(text, maxLength = 200) {
    try {
        const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional summarizer. Create a concise summary of the following text in about ${maxLength} words. Focus on the key points and main ideas.`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Summarization error:', error);
        throw new Error(`Summarization failed: ${error.message}`);
    }
}

/**
 * Extracts specific information from text
 * @param {string} text - The text to extract information from
 * @param {string} query - The specific information to extract
 * @returns {Promise<string>} - The extracted information
 */
async function extractInformation(text, query) {
    try {
        const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `You are an information extraction expert. Extract the following information from the text: ${query}. Provide only the relevant information without any explanations or additional content.`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Information extraction error:', error);
        throw new Error(`Information extraction failed: ${error.message}`);
    }
}

/**
 * Performs OCR on an image using Tesseract.js
 * @param {string} imageData - Base64 encoded image data
 * @returns {Promise<string>} - The extracted text
 */
async function performOCR(imageData) {
    try {
        // Load Tesseract.js if not already loaded
        await loadTesseractScript();
        
        // Show notification that OCR is processing
        if (typeof showNotification === 'function') {
            showNotification('Processing OCR on image. This may take a moment...', 'info');
        }
        
        // Create an image element from the base64 data
        const img = new Image();
        img.src = imageData;
        
        // Wait for the image to load
        await new Promise(resolve => {
            img.onload = resolve;
        });
        
        // Perform OCR using Tesseract.js
        const result = await Tesseract.recognize(img, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text' && typeof showNotification === 'function') {
                    showNotification(`OCR Progress: ${Math.round(m.progress * 100)}%`, 'info');
                }
            }
        });
        
        // Hide notification if function exists
        if (typeof hideNotification === 'function') {
            hideNotification();
        }
        
        // Return the recognized text with preserved formatting
        return result.data.text;
    } catch (error) {
        console.error('OCR Error:', error);
        
        // Show error notification if function exists
        if (typeof showNotification === 'function') {
            showNotification('OCR failed. Please try again or use a clearer image.', 'error');
        }
        
        // Fallback to LLM for guidance if OCR fails
        return await askLLMForOCRGuidance();
    }
}

/**
 * Gets the language name from the language code
 * @param {string} code - The language code
 * @returns {string} - The language name
 */
function getLanguageName(code) {
    const language = LANGUAGE_OPTIONS.find(lang => lang.code === code);
    return language ? language.name : 'Unknown';
}

/**
 * Populates a select element with language options
 * @param {HTMLSelectElement} selectElement - The select element to populate
 * @param {string} defaultLanguage - The default language code to select
 */
function populateLanguageOptions(selectElement, defaultLanguage = 'en') {
    LANGUAGE_OPTIONS.forEach(language => {
        const option = document.createElement('option');
        option.value = language.code;
        option.textContent = language.name;
        selectElement.appendChild(option);
    });
    
    selectElement.value = defaultLanguage;
}

// Add Tesseract.js script to the document
function loadTesseractScript() {
    return new Promise((resolve, reject) => {
        if (window.Tesseract) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Tesseract.js'));
        document.head.appendChild(script);
    });
}

// Fallback function to ask LLM for OCR guidance
async function askLLMForOCRGuidance() {
    try {
        const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an OCR expert. Provide guidance on extracting text from scanned documents.'
                    },
                    {
                        role: 'user',
                        content: 'I\'m trying to extract text from a scanned PDF page but the OCR process failed. What are some alternative approaches or tips to improve text extraction from scanned documents?'
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('LLM OCR Guidance Error:', error);
        return 'OCR failed. Try using a clearer image or manually transcribe the text.';
    }
}

// Export functions for use in other modules
window.LLMService = {
    translateText,
    summarizeContent,
    extractInformation,
    performOCR,
    populateLanguageOptions,
    LANGUAGE_OPTIONS
}; 