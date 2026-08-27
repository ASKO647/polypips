export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

/** Shared renderer for the data-driven paragraph/heading/list blocks used
 * by both blog articles (lib/data/blog.ts) and guides
 * (lib/data/guides.ts) — keeps their prose typography identical without
 * either page hardcoding JSX for its own content. */
export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-body sm:text-base">
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return (
            <h2
              key={i}
              className="mt-2 font-display text-xl font-bold text-ink sm:text-2xl"
            >
              {block.text}
            </h2>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i} className="flex flex-col gap-2 pl-1">
              {block.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{block.text}</p>;
      })}
    </div>
  );
}
