import {
  FileText,
  File,
  Globe,
  Database,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

function getDocumentData(doc, index) {
  if (typeof doc === "string") {
    return {
      title: `Retrieved Document ${index + 1}`,
      content: doc,
      source: null,
      type: "document",
    };
  }

  return {
    title:
      doc?.title ||
      doc?.name ||
      doc?.metadata?.title ||
      doc?.metadata?.source ||
      `Retrieved Document ${index + 1}`,

    content:
      doc?.content ||
      doc?.page_content ||
      doc?.text ||
      doc?.chunk ||
      "",

    source:
      doc?.source ||
      doc?.url ||
      doc?.metadata?.source ||
      null,

    type:
      doc?.type ||
      doc?.metadata?.type ||
      "document",
  };
}

function DocumentIcon({ type }) {
  if (type === "web" || type === "url") {
    return <Globe size={18} />;
  }

  if (type === "database") {
    return <Database size={18} />;
  }

  if (type === "file") {
    return <File size={18} />;
  }

  return <FileText size={18} />;
}


/*
 * Each retrieved document gets a different accent.
 *
 * 0 → Purple
 * 1 → Red
 * 2 → Teal
 * 3 → Blue
 * 4 → Warm Neutral
 * 5 → Purple again
 */
const documentColors = [
  {
    name: "purple",

    iconBg: "bg-[#eeeaff]",
    iconText: "text-[#7258b2]",

    numberBg: "bg-[#eeeaff]",
    numberText: "text-[#7258b2]",

    badgeBg: "bg-[#f1edfa]",
    badgeText: "text-[#7258b2]",

    accent: "bg-[#8b72c7]",

    hoverBorder: "hover:border-[#cfc3eb]",
    hoverShadow: "hover:shadow-[0_8px_25px_rgba(114,88,178,0.10)]",

    sourceText: "text-[#8069b8]",
    sourceHover: "hover:text-[#5f4697]",
  },

  {
    name: "red",

    iconBg: "bg-[#fbeceb]",
    iconText: "text-[#bd5b5b]",

    numberBg: "bg-[#fbeceb]",
    numberText: "text-[#bd5b5b]",

    badgeBg: "bg-[#fcefee]",
    badgeText: "text-[#b75a5a]",

    accent: "bg-[#d47777]",

    hoverBorder: "hover:border-[#efcaca]",
    hoverShadow: "hover:shadow-[0_8px_25px_rgba(190,91,91,0.09)]",

    sourceText: "text-[#bb6565]",
    sourceHover: "hover:text-[#994646]",
  },

  {
    name: "teal",

    iconBg: "bg-[#e8f6f4]",
    iconText: "text-[#3e938b]",

    numberBg: "bg-[#e8f6f4]",
    numberText: "text-[#3e938b]",

    badgeBg: "bg-[#eaf7f5]",
    badgeText: "text-[#3d8982]",

    accent: "bg-[#5ca9a1]",

    hoverBorder: "hover:border-[#c5e6e2]",
    hoverShadow: "hover:shadow-[0_8px_25px_rgba(62,147,139,0.09)]",

    sourceText: "text-[#4d958e]",
    sourceHover: "hover:text-[#33746e]",
  },

  {
    name: "blue",

    iconBg: "bg-[#eaf1fb]",
    iconText: "text-[#4f79b7]",

    numberBg: "bg-[#eaf1fb]",
    numberText: "text-[#4f79b7]",

    badgeBg: "bg-[#edf3fb]",
    badgeText: "text-[#4f76ae]",

    accent: "bg-[#6c94c9]",

    hoverBorder: "hover:border-[#c8d9ee]",
    hoverShadow: "hover:shadow-[0_8px_25px_rgba(79,121,183,0.09)]",

    sourceText: "text-[#5b82b9]",
    sourceHover: "hover:text-[#41689b]",
  },

  {
    name: "warm",

    iconBg: "bg-[#f5efe7]",
    iconText: "text-[#9a7652]",

    numberBg: "bg-[#f5efe7]",
    numberText: "text-[#967451]",

    badgeBg: "bg-[#f7f1e9]",
    badgeText: "text-[#927052]",

    accent: "bg-[#b29470]",

    hoverBorder: "hover:border-[#e5d8c8]",
    hoverShadow: "hover:shadow-[0_8px_25px_rgba(154,118,82,0.08)]",

    sourceText: "text-[#9a7858]",
    sourceHover: "hover:text-[#795a3e]",
  },
];


export default function ReceivedDocs({ documents = [] }) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-black/[0.07] bg-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.04)] backdrop-blur-xl">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="shrink-0 border-b border-black/[0.06] px-5 py-5 sm:px-6">

        <div className="flex items-center justify-between gap-4">

          <div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-500">
              RAG Retrieval
            </p>

            <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#292735]">
              Retrieved Documents
            </h2>

            <p className="mt-1 text-xs text-[#8d8a98]">
              Sources used to generate this answer
            </p>

          </div>

          {/* COUNT */}

          <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#eeeaff] px-3 text-xs font-semibold text-[#6d5ba8]">
            {documents.length}
          </div>

        </div>

      </div>


      {/* =====================================================
          DOCUMENTS
      ====================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">

        {documents.length === 0 ? (

          /* EMPTY */

          <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-center">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f3fa] text-[#9992ad]">
              <FileText size={24} />
            </div>

            <h3 className="text-sm font-semibold text-[#34313f]">
              No documents retrieved
            </h3>

            <p className="mt-1 max-w-[240px] text-xs leading-5 text-[#9995a3]">
              Retrieved documents will appear here when you ask a question.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {documents.map((doc, index) => {

              const data = getDocumentData(doc, index);

              /*
               * Cycle through the five colors
               */
              const color =
                documentColors[index % documentColors.length];

              return (

                <article
                  key={index}
                  className={`
                    group
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-black/[0.06]
                    bg-[#fbfbfd]
                    p-4
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    hover:bg-white
                    ${color.hoverBorder}
                    ${color.hoverShadow}
                  `}
                >

                  {/* =================================================
                      COLOR ACCENT
                  ================================================== */}

                  <div
                    className={`
                      absolute
                      left-0
                      top-0
                      h-full
                      w-[3px]
                      ${color.accent}
                    `}
                  />


                  {/* =================================================
                      DOCUMENT TOP
                  ================================================== */}

                  <div className="flex items-start gap-3">

                    {/* ICON */}

                    <div
                      className={`
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        ${color.iconBg}
                        ${color.iconText}
                      `}
                    >
                      <DocumentIcon type={data.type} />
                    </div>


                    {/* TITLE */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-2">

                        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#302d3b]">
                          {data.title}
                        </h3>


                        {/* NUMBER */}

                        <span
                          className={`
                            flex
                            h-5
                            min-w-5
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            px-1.5
                            text-[9px]
                            font-semibold
                            ${color.numberBg}
                            ${color.numberText}
                          `}
                        >
                          {index + 1}
                        </span>

                      </div>


                      {/* SOURCE */}

                      {data.source && (
                        <p className="mt-1 truncate text-[11px] text-[#96929f]">
                          {data.source}
                        </p>
                      )}

                    </div>

                  </div>


                  {/* =================================================
                      CONTENT PREVIEW
                  ================================================== */}

                  {data.content && (

                    <p className="mt-3 line-clamp-4 text-xs leading-5 text-[#777381]">
                      {data.content}
                    </p>

                  )}


                  {/* =================================================
                      FOOTER
                  ================================================== */}

                  <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] pt-3">

                    {/* TYPE */}

                    <span
                      className={`
                        rounded-full
                        px-2.5
                        py-1
                        text-[10px]
                        font-medium
                        ${color.badgeBg}
                        ${color.badgeText}
                      `}
                    >
                      {data.type}
                    </span>


                    {/* SOURCE */}

                    {data.source ? (

                      <a
                        href={data.source}
                        target="_blank"
                        rel="noreferrer"
                        className={`
                          flex
                          items-center
                          gap-1
                          text-[11px]
                          font-medium
                          transition-colors
                          ${color.sourceText}
                          ${color.sourceHover}
                        `}
                      >

                        Open source

                        <ExternalLink size={12} />

                      </a>

                    ) : (

                      <span
                        className={`
                          flex
                          items-center
                          gap-1
                          text-[11px]
                          text-[#aaa5b1]
                        `}
                      >

                        Retrieved

                        <ChevronRight size={12} />

                      </span>

                    )}

                  </div>

                </article>

              );

            })}

          </div>

        )}

      </div>

    </section>
  );
}