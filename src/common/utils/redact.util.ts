/**
 * Redacts sensitive fields from an object
 * @param obj - Object to redact
 * @param sensitiveFields - Array of field names to redact
 * @returns Sanitized object safe for logging
 */
export function redactSensitiveFields(
  obj: Record<string, unknown>,
  sensitiveFields: string[] = ['x-api-key', 'authorization', 'password', 'token'],
): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const redacted = { ...obj };

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '***REDACTED***';
    }
  }

  return redacted;
}

/**
 * Masks sensitive strings (e.g., API keys) for logging
 * Shows first 4 and last 4 characters
 * @param value - String to mask
 * @returns Masked string
 */
export function maskSensitiveString(value: string): string {
  if (!value || value.length < 8) {
    return '***';
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}