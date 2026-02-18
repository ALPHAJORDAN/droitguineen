import xss, { IFilterXSSOptions } from 'xss';
import validator from 'validator';

// XSS options - strip all HTML tags
const xssOptions: IFilterXSSOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'frame', 'object', 'embed'],
};

/**
 * Sanitize HTML content, removing all potentially dangerous tags
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return xss(input, xssOptions);
}

/**
 * Sanitize a string by escaping special characters and trimming
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return validator.escape(validator.trim(input));
}

/**
 * Sanitize a filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return '';

  return filename
    // Remove path separators
    .replace(/[/\\]/g, '_')
    // Remove special characters except dots, dashes, underscores
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Remove multiple consecutive underscores
    .replace(/_{2,}/g, '_')
    // Remove leading/trailing dots and underscores
    .replace(/^[._]+|[._]+$/g, '')
    // Limit length
    .substring(0, 255);
}

/**
 * Validate and return true if the string is a valid UUID
 */
export function isValidUUID(input: string): boolean {
  if (typeof input !== 'string') return false;
  return validator.isUUID(input);
}

/**
 * Validate and return true if the string is a valid URL
 */
export function isValidUrl(input: string): boolean {
  if (typeof input !== 'string') return false;
  return validator.isURL(input, {
    protocols: ['http', 'https'],
    require_protocol: true,
  });
}

/**
 * Validate and return true if the string is a valid email
 */
export function isValidEmail(input: string): boolean {
  if (typeof input !== 'string') return false;
  return validator.isEmail(input);
}

/**
 * Sanitize an object recursively, escaping all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Normalize and sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return '';

  return query
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Remove special search characters that could cause issues
    .replace(/[<>{}[\]\\^~`|]/g, '')
    // Limit length
    .substring(0, 500);
}

/**
 * Check if a string contains potentially malicious content
 */
export function containsMaliciousContent(input: string): boolean {
  if (typeof input !== 'string') return false;

  const maliciousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ];

  return maliciousPatterns.some((pattern) => pattern.test(input));
}
