// Renders a JSON-LD <script>. Server component — no client JS shipped.
// `<` is escaped to < so a DB-sourced string (e.g. a pandit name or product
// description) containing "</script>" can't break out of the block / inject.
export default function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
