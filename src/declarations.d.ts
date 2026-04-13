// Ambient type declarations for non-TypeScript imports

// Markdown files are loaded as raw strings via webpack's asset/source rule.
// See webpack.config.js for the matching rule.
declare module '*.md' {
  const content: string;
  export default content;
}
