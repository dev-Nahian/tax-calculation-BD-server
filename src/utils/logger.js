/**
 * TaxBD Centralized Privacy-Conscious Structured Logger
 * 
 * Complies with strict privacy standards:
 * - Redacts passwords, tokens, secrets, MongoDB URIs
 * - Redacts personal financial information (salary figures, gross income, TIN numbers)
 * - Logs audit trails for admin mutations, authentication failures, rule changes, and calculation errors
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'jwtsecret',
  'secret',
  'mongouri',
  'authorization',
  'cookie',
  'tinnumber',
  'nationalid',
  'basicsalary',
  'grosssalary',
  'grossincome',
  'taxableincome',
  'salary',
  'totaltax',
  'netwealth',
]);

/**
 * Recursively sanitize metadata to remove sensitive data
 */
export const sanitizeLogData = (data, depth = 0) => {
  if (depth > 5 || !data) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (typeof value === 'string' && (value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'))) {
      sanitized[key] = '[REDACTED_DATABASE_URI]';
    } else if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const formatLog = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  const sanitizedMeta = meta ? sanitizeLogData(meta) : null;
  const metaStr = sanitizedMeta ? ` | ${JSON.stringify(sanitizedMeta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  info: (message, meta = null) => {
    console.log(formatLog('info', message, meta));
  },

  warn: (message, meta = null) => {
    console.warn(formatLog('warn', message, meta));
  },

  error: (message, metaOrError = null) => {
    if (metaOrError instanceof Error) {
      const errorMeta = {
        name: metaOrError.name,
        message: metaOrError.message,
        code: metaOrError.code,
      };
      if (process.env.NODE_ENV !== 'production') {
        errorMeta.stack = metaOrError.stack;
      }
      console.error(formatLog('error', message, errorMeta));
    } else {
      console.error(formatLog('error', message, metaOrError));
    }
  },

  /**
   * Log authentication failures without storing submitted passwords
   */
  authFailure: ({ email, ip, reason }) => {
    const meta = {
      event: 'AUTH_FAILURE',
      email: email ? email.substring(0, 3) + '***@' + (email.split('@')[1] || 'domain') : '[NONE]',
      ip: ip || 'unknown',
      reason: reason || 'Invalid credentials',
    };
    console.warn(formatLog('warn', `Authentication failure for ${meta.email}`, meta));
  },

  /**
   * Log calculation errors without logging personal finances
   */
  calculationError: ({ assessmentYear, errorName, errorMessage, ip }) => {
    const meta = {
      event: 'CALCULATION_ERROR',
      assessmentYear: assessmentYear || 'unknown',
      errorName: errorName || 'Error',
      errorMessage: errorMessage || 'Calculation execution failed',
      ip: ip || 'unknown',
    };
    console.error(formatLog('error', `Tax calculation error (${assessmentYear}): ${errorMessage}`, meta));
  },

  /**
   * Log administrative mutations & governance actions
   */
  adminAction: ({ adminId, action, target, details }) => {
    const meta = {
      event: 'ADMIN_AUDIT',
      adminId: String(adminId || 'unknown'),
      action,
      target,
      details: sanitizeLogData(details),
    };
    console.log(formatLog('info', `Admin action '${action}' on ${target}`, meta));
  },

  /**
   * Log tax rule alterations and verifications
   */
  taxRuleChange: ({ assessmentYear, changeType, adminId, ruleType }) => {
    const meta = {
      event: 'TAX_RULE_MUTATION',
      assessmentYear,
      changeType,
      ruleType,
      adminId: String(adminId || 'system'),
    };
    console.log(formatLog('info', `Tax rule changed for AY ${assessmentYear} (${changeType} - ${ruleType})`, meta));
  },
};

export default logger;
