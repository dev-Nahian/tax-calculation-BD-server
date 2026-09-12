/**
 * Sanitize object keys and values against MongoDB operator injection
 * Removes keys starting with '$' or containing '.'
 */
const sanitizeMongoQuery = (obj, depth = 0) => {
  if (!obj || typeof obj !== 'object' || depth > 10) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeMongoQuery(item, depth + 1));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip forbidden MongoDB query operator keys
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeMongoQuery(value, depth + 1);
    } else if (typeof value === 'string') {
      // Trim strings
      cleaned[key] = value.trim();
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

/**
 * Express middleware for deep sanitization
 */
export const mongoSanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeMongoQuery(req.body);
  }
  if (req.query) {
    req.query = sanitizeMongoQuery(req.query);
  }
  if (req.params) {
    req.params = sanitizeMongoQuery(req.params);
  }
  next();
};

export default mongoSanitize;
