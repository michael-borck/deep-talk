/**
 * Canonical external URLs for DeepTalk.
 *
 * Centralised so that any future repo move is a one-line change. Renderer
 * code should import from here rather than hard-coding URLs.
 *
 * The mirror values for the main process live in `public/electron-urls.js`
 * (kept in sync manually since the main process uses CommonJS and can't
 * import this TypeScript module).
 */

export const URLS = {
  /** Source repository on GitHub */
  REPO: 'https://github.com/michael-borck/deep-talk',
  /** Issue tracker */
  ISSUES: 'https://github.com/michael-borck/deep-talk/issues',
  /** Public Jekyll docs site (kept as a mirror; the in-app docs are the
   *  primary source of truth now). */
  DOCS_SITE: 'https://michael-borck.github.io/deep-talk',
} as const;
