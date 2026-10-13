import { getTranslations } from "next-intl/server";
import { buttonClass } from "./ui";

/** A plain GET form, so search works without JavaScript and the URL can be shared. */
export async function SearchBox({
  q,
  placeholder,
  hidden = {},
}: {
  q?: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
}) {
  const t = await getTranslations("common");
  return (
    <form role="search" className="flex gap-2">
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-12 w-full rounded-lg border border-line-strong bg-white px-3 md:w-80"
      />
      <button type="submit" className={buttonClass("secondary")}>
        {t("search")}
      </button>
    </form>
  );
}
