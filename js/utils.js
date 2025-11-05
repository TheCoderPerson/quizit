// Utility Functions for QuizIt

/**
 * Format a timestamp to a human-readable date string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

/**
 * Format a duration in milliseconds to a readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(ms) {
    if (!ms || ms < 0) return '0:00';

    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

/**
 * Format milliseconds to hours and minutes
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted string
 */
export function formatTime(ms) {
    if (!ms || ms < 0) return '0h 0m';

    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    } else {
        return `${remainingMinutes}m`;
    }
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Calculate similarity between two strings (simple Levenshtein distance)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity percentage (0-100)
 */
export function calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Levenshtein distance
    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return Math.round(similarity);
}

/**
 * Check if answer is correct (with fuzzy matching)
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @param {number} threshold - Similarity threshold (0-100), default 80
 * @returns {boolean} True if answer is correct
 */
export function isAnswerCorrect(userAnswer, correctAnswer, threshold = 80) {
    if (!userAnswer || !correctAnswer) return false;

    const similarity = calculateSimilarity(userAnswer, correctAnswer);
    return similarity >= threshold;
}

/**
 * Debounce function - delays execution until after wait time
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function - limits execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Get theme preference from localStorage or system
 * @returns {string} Theme name ('light' or 'dark')
 */
export function getThemePreference() {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    return 'light';
}

/**
 * Set theme preference
 * @param {string} theme - Theme name ('light' or 'dark')
 */
export function setThemePreference(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Toggle theme between light and dark
 */
export function toggleTheme() {
    const current = getThemePreference();
    const newTheme = current === 'light' ? 'dark' : 'light';
    setThemePreference(newTheme);
    return newTheme;
}

/**
 * Get test question type preference from localStorage
 * @returns {string} Question type preference ('mc', 'written', or 'mix')
 */
export function getTestQuestionTypePreference() {
    const stored = localStorage.getItem('testQuestionType');
    const result = stored || 'mix'; // Default to 'mix' for backward compatibility
    console.log('[DEBUG] getTestQuestionTypePreference() - stored value:', stored, '| returning:', result);
    return result;
}

/**
 * Set test question type preference
 * @param {string} type - Question type ('mc', 'written', or 'mix')
 */
export function setTestQuestionTypePreference(type) {
    if (!['mc', 'written', 'mix'].includes(type)) {
        console.error('Invalid test question type:', type);
        return;
    }
    console.log('[DEBUG] setTestQuestionTypePreference() - setting to:', type);
    localStorage.setItem('testQuestionType', type);
    console.log('[DEBUG] Verification - localStorage now contains:', localStorage.getItem('testQuestionType'));
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

/**
 * Show a toast notification
 * @param {string} message - Message to show
 * @param {string} type - Type of toast ('success', 'error', 'info')
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existing = document.querySelector('.toast');
    if (existing) {
        existing.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const styles = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;

    toast.style.cssText = styles;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Parse JSON safely
 * @param {string} json - JSON string
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
export function safeJsonParse(json, defaultValue = null) {
    try {
        return JSON.parse(json);
    } catch (error) {
        console.error('JSON parse error:', error);
        return defaultValue;
    }
}

/**
 * Download data as a file
 * @param {string} data - Data to download
 * @param {string} filename - Filename
 * @param {string} type - MIME type
 */
export function downloadFile(data, filename, type = 'application/json') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Get query parameter from URL
 * @param {string} param - Parameter name
 * @returns {string|null} Parameter value
 */
export function getUrlParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Set multiple query parameters in URL
 * @param {Object} params - Parameters object
 */
export function setUrlParameters(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.replaceState({}, '', url);
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
