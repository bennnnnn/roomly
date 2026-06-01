/**
 * Client-side contact-info detection (UX warning only).
 * Server-side enforcement is required for chat/listings (PRD §2.3).
 */

const PATTERNS: readonly RegExp[] = [
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/gi,
  /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  /\bhttps?:\/\/\S+/gi,
  /\bwww\.\S+/gi,
  /@\w{2,}/g,
];

export interface ContactInfoMatch {
  kind: 'email' | 'phone' | 'url' | 'handle';
  index: number;
}

function classifyMatch(matched: string): ContactInfoMatch['kind'] {
  if (matched.includes('@') && !/^https?:/i.test(matched)) {
    return matched.includes('.') ? 'email' : 'handle';
  }
  if (/https?:\/\//i.test(matched) || /^www\./i.test(matched)) return 'url';
  if (/\d{3}/.test(matched)) return 'phone';
  /* istanbul ignore next -- defensive; current PATTERNS always include @, digits, or URL */
  return 'handle';
}

/** Returns matches found in text (empty = clean). */
export function detectContactInfo(text: string): ContactInfoMatch[] {
  const out: ContactInfoMatch[] = [];
  for (const pattern of PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[0];
      /* istanbul ignore next -- RegExpMatchArray.index is always defined for matchAll */
      const index = match.index ?? 0;
      out.push({ kind: classifyMatch(raw), index });
    }
  }
  return out;
}

export function hasContactInfo(text: string): boolean {
  return detectContactInfo(text).length > 0;
}
