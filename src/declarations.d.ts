// Allow CSS side-effect imports in Next.js
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
