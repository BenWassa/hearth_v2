import { getSpaceIdFromName } from './spaces.js';

describe('getSpaceIdFromName', () => {
  it('returns the same ID for names that differ only by case or spacing', () => {
    const first = getSpaceIdFromName('  Space   123  ');
    const second = getSpaceIdFromName('space 123');
    expect(first).toBe(second);
    expect(first).toMatch(/^space-space-123-/);
  });

  it('returns different IDs for different normalized names', () => {
    const alpha = getSpaceIdFromName('Space 123');
    const beta = getSpaceIdFromName('Space 124');
    expect(alpha).not.toBe(beta);
  });

  it('returns an empty ID when the input is blank', () => {
    expect(getSpaceIdFromName('   ')).toBe('');
  });
});
