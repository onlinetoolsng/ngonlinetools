// 📁 components/seo/SchemaOrg.tsx

type Schema = Record<string, any>

export function SchemaOrg({ schema }: { schema?: Schema | Schema[] }) {
  if (!schema) return null

  const schemas = Array.isArray(schema) ? schema : [schema]

  return (
    <>
      {schemas
        .filter(Boolean)
        .map((s, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(s),
            }}
          />
        ))}
    </>
  )
}