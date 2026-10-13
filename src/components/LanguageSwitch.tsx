import { getLocale } from "next-intl/server";
import { setLocale } from "@/app/locale-actions";

/** Two plain buttons, each written in its own language so anyone can find theirs. */
export async function LanguageSwitch() {
  const locale = await getLocale();
  const options = [
    { value: "en", label: "English" },
    { value: "hi", label: "हिंदी" },
  ];
  return (
    <form action={setLocale} className="flex gap-1 rounded-lg border border-line bg-panel p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="submit"
          name="locale"
          value={o.value}
          aria-pressed={locale === o.value}
          className={`min-h-10 rounded-md px-3 text-sm font-semibold ${
            locale === o.value ? "bg-brand text-white" : "text-ink hover:bg-brand-soft"
          }`}
        >
          {o.label}
        </button>
      ))}
    </form>
  );
}
