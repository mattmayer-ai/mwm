interface CaseSectionProps {
  id: string;
  title: string;
  body: string;
}

export function CaseSection({ id, title, body }: CaseSectionProps) {
  return (
    <section id={`sec-${id}`} className="mb-8 scroll-mt-20 transition-all duration-300">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </section>
  );
}

