// From the Next.js guide on preventing flash before hydration: the script
// runs from the server HTML, and the client renders it inert (text/plain) so
// React never warns about a script it would not execute.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
