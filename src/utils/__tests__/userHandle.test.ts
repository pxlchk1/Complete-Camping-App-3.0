/**
 * User Handle Attribution Tests
 * 
 * These tests ensure Connect attribution never regresses to bad patterns:
 * - "@user###"
 * - "Anonymous"
 * - First names as handles
 * - Users with stored handles showing "@Camper" fallback
 */

import { getDisplayHandle, isValidHandle, generateCamperHandle, normalizeHandle } from '../userHandle';

describe('getDisplayHandle', () => {
  describe('valid handles', () => {
    it('returns normalized handle when valid handle exists', () => {
      expect(getDisplayHandle({ handle: 'tentandlantern', uid: 'abc123' })).toBe('@tentandlantern');
    });

    it('handles @ prefix correctly', () => {
      expect(getDisplayHandle({ handle: '@tentandlantern', uid: 'abc123' })).toBe('@tentandlantern');
    });

    it('handles mixed case', () => {
      expect(getDisplayHandle({ handle: 'TentAndLantern', uid: 'abc123' })).toBe('@TentAndLantern');
    });

    it('accepts handles with underscores', () => {
      expect(getDisplayHandle({ handle: 'tent_lantern', uid: 'abc123' })).toBe('@tent_lantern');
    });

    it('accepts handles with numbers', () => {
      expect(getDisplayHandle({ handle: 'camper2024', uid: 'abc123' })).toBe('@camper2024');
    });
  });

  describe('fallback to @CamperXXXX', () => {
    it('returns @CamperXXXX when handle is null', () => {
      const result = getDisplayHandle({ handle: null, uid: 'abc123' });
      expect(result).toMatch(/^@Camper\d+$/);
      expect(result).not.toContain('@user');
    });

    it('returns @CamperXXXX when handle is empty string', () => {
      const result = getDisplayHandle({ handle: '', uid: 'abc123' });
      expect(result).toMatch(/^@Camper\d+$/);
    });

    it('returns @CamperXXXX when handle is whitespace', () => {
      const result = getDisplayHandle({ handle: '   ', uid: 'abc123' });
      expect(result).toMatch(/^@Camper\d+$/);
    });

    it('is deterministic for same uid', () => {
      const result1 = getDisplayHandle({ handle: null, uid: 'user123' });
      const result2 = getDisplayHandle({ handle: null, uid: 'user123' });
      expect(result1).toBe(result2);
    });

    it('produces different results for different uids', () => {
      const result1 = getDisplayHandle({ handle: null, uid: 'user123' });
      const result2 = getDisplayHandle({ handle: null, uid: 'user456' });
      expect(result1).not.toBe(result2);
    });
  });

  describe('NEVER returns banned patterns', () => {
    it('never returns @user### pattern', () => {
      const testCases = [
        { handle: null, uid: 'test1' },
        { handle: '', uid: 'test2' },
        { handle: 'user123', uid: 'test3' }, // should reject this
      ];
      
      testCases.forEach(tc => {
        const result = getDisplayHandle(tc);
        expect(result).not.toMatch(/^@user\d+$/i);
      });
    });

    it('never returns "Anonymous"', () => {
      const result = getDisplayHandle({ handle: 'Anonymous', uid: 'test' });
      expect(result).not.toBe('@Anonymous');
      expect(result).not.toBe('Anonymous');
      expect(result).toMatch(/^@Camper\d+$/);
    });

    it('rejects first names and uses fallback', () => {
      const firstNames = ['Alana', 'John', 'Sarah', 'Mike', 'Emma'];
      
      firstNames.forEach(name => {
        const result = getDisplayHandle({ handle: name, uid: 'test123' });
        expect(result).toMatch(/^@Camper\d+$/);
        expect(result).not.toBe(`@${name}`);
      });
    });

    it('rejects handles with spaces', () => {
      const result = getDisplayHandle({ handle: 'Alana Waters', uid: 'test123' });
      expect(result).toMatch(/^@Camper\d+$/);
    });
  });

  describe('user with stored handle NEVER shows @Camper fallback', () => {
    it('shows actual handle when valid handle is provided', () => {
      // This is the critical test - if a user has a valid stored handle,
      // they should NEVER see @CamperXXXX
      const result = getDisplayHandle({ handle: 'tentandlantern', uid: 'someuid' });
      expect(result).toBe('@tentandlantern');
      expect(result).not.toMatch(/^@Camper\d+$/);
    });
  });
});

describe('isValidHandle', () => {
  it('returns true for valid handles', () => {
    expect(isValidHandle('tentandlantern')).toBe(true);
    expect(isValidHandle('camper2024')).toBe(true);
    expect(isValidHandle('tent_lantern')).toBe(true);
    expect(isValidHandle('@validhandle')).toBe(true);
  });

  it('returns false for null/undefined/empty', () => {
    expect(isValidHandle(null)).toBe(false);
    expect(isValidHandle(undefined)).toBe(false);
    expect(isValidHandle('')).toBe(false);
    expect(isValidHandle('   ')).toBe(false);
  });

  it('returns false for common first names', () => {
    expect(isValidHandle('Alana')).toBe(false);
    expect(isValidHandle('John')).toBe(false);
    expect(isValidHandle('Sarah')).toBe(false);
    expect(isValidHandle('mike')).toBe(false);
  });

  it('returns false for banned patterns', () => {
    expect(isValidHandle('Anonymous')).toBe(false);
    expect(isValidHandle('user123')).toBe(false);
    expect(isValidHandle('guest')).toBe(false);
    expect(isValidHandle('unknown')).toBe(false);
  });

  it('returns false for handles with spaces', () => {
    expect(isValidHandle('Alana Waters')).toBe(false);
    expect(isValidHandle('tent and lantern')).toBe(false);
  });
});

describe('generateCamperHandle', () => {
  it('always starts with @Camper', () => {
    expect(generateCamperHandle('test')).toMatch(/^@Camper\d+$/);
  });

  it('is deterministic', () => {
    expect(generateCamperHandle('same')).toBe(generateCamperHandle('same'));
  });

  it('returns @Camper0000 for empty input', () => {
    expect(generateCamperHandle('')).toBe('@Camper0000');
  });
});

describe('normalizeHandle', () => {
  it('adds @ prefix if missing', () => {
    expect(normalizeHandle('handle')).toBe('@handle');
  });

  it('keeps @ prefix if present', () => {
    expect(normalizeHandle('@handle')).toBe('@handle');
  });

  it('removes whitespace', () => {
    expect(normalizeHandle('  handle  ')).toBe('@handle');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeHandle('')).toBe('');
  });
});
