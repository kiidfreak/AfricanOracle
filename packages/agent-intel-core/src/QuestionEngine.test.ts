import { describe, it, expect } from 'vitest';
import { QuestionEngine } from './QuestionEngine';

describe('QuestionEngine', () => {
  const engine = new QuestionEngine();

  it('should generate a macro-style question for a CBK trend', () => {
    const result = engine.generate('inflation spike', 'macro');
    expect(result.question).toContain('CBK');
    expect(result.question).toContain('inflation spike');
    expect(result.category).toBe('macro');
  });

  it('should generate an agriculture-style question for a weather trend', () => {
    const result = engine.generate('drought in Rift Valley', 'agriculture');
    expect(result.question).toContain('maize supply shock');
    expect(result.question).toContain('drought in Rift Valley');
  });

  it('should fall back to a generic question for unknown categories', () => {
    const result = engine.generate('strange event', 'unknown');
    expect(result.question).toBe('Will strange event impact market prices this quarter?');
  });
});
