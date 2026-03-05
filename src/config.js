// Centralized configuration for the SiCater application
const isProd = window.location.hostname !== 'localhost';

// The AI_BASE_URL is where the Python OCR service is running.
export const AI_BASE_URL = isProd
    ? 'https://abdinegara-sicater-ocr.hf.space' // Hugging Face Space URL
    : '/ai'; // Proxied path in development

// IMAGE_BASE_URL is used for loading uploaded images.
// In development (localhost), it points to the local XAMPP server.
// In production, we use relative paths or the current origin.
export const IMAGE_BASE_URL = isProd
    ? '' // Use absolute paths directly (e.g., /uploads/...)
    : 'http://localhost';   // Development: local XAMPP
