import renderMathInElement from 'katex/contrib/auto-render';

export function renderBlogMath(scope: HTMLElement) {
  renderMathInElement(scope, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
    ],
    ignoredClasses: ['katex', 'katex-display', 'blog-math-ignore'],
    throwOnError: false,
    trust: false,
    maxSize: 20,
    maxExpand: 1000,
  });
}
