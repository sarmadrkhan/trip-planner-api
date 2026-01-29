import { redactSensitiveFields, maskSensitiveString } from './redact.util';

describe('Redaction Utilities', () => {
  describe('redactSensitiveFields', () => {
    it('should redact default sensitive fields', () => {
      const input = {
        'x-api-key': 'secret-key-12345',
        'content-type': 'application/json',
        authorization: 'Bearer token123',
      };

      const result = redactSensitiveFields(input);

      expect(result['x-api-key']).toBe('***REDACTED***');
      expect(result['authorization']).toBe('***REDACTED***');
      expect(result['content-type']).toBe('application/json');
    });

    it('should redact custom sensitive fields', () => {
      const input = {
        apiKey: 'secret',
        userId: '12345',
        sessionToken: 'abc123',
      };

      const result = redactSensitiveFields(input, ['apiKey', 'sessionToken']);

      expect(result['apiKey']).toBe('***REDACTED***');
      expect(result['sessionToken']).toBe('***REDACTED***');
      expect(result['userId']).toBe('12345');
    });

    it('should handle null or undefined input', () => {
      expect(redactSensitiveFields(null as never)).toBeNull();
      expect(redactSensitiveFields(undefined as never)).toBeUndefined();
    });

    it('should not mutate original object', () => {
      const input = {
        'x-api-key': 'secret',
        'content-type': 'application/json',
      };

      const original = { ...input };
      redactSensitiveFields(input);

      expect(input).toEqual(original);
    });
  });

  describe('maskSensitiveString', () => {
    it('should mask long strings showing first and last 4 chars', () => {
      const input = 'abcdefghijklmnop';
      const result = maskSensitiveString(input);

      expect(result).toBe('abcd...mnop');
    });

    it('should mask short strings completely', () => {
      const input = 'short';
      const result = maskSensitiveString(input);

      expect(result).toBe('***');
    });

    it('should handle empty strings', () => {
      const result = maskSensitiveString('');

      expect(result).toBe('***');
    });
  });
});