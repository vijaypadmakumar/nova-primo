import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* Small set of building blocks so every screen looks and behaves the same. */

const buttonBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors disabled:opacity-60";
const buttonVariants = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "border border-line-strong bg-panel text-ink hover:bg-brand-soft",
  danger: "border border-bad bg-panel text-bad hover:bg-bad-soft",
};
type Variant = keyof typeof buttonVariants;

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${buttonBase} ${buttonVariants[variant]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  shortcut,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; shortcut?: string }) {
  return (
    <Link className={buttonClass(variant, className)} {...props}>
      {children}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </Link>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="hidden rounded border border-current/40 px-1.5 py-0.5 font-sans text-xs font-normal opacity-80 md:inline">
      {children}
    </kbd>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-panel p-5 md:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function EmptyState({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-panel px-6 py-12 text-center">
      <p className="text-lg text-muted">{title}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Label above the control, hint and error below: the easiest layout to scan. */
export function Field({
  label,
  name,
  error,
  hint,
  required,
  children,
}: {
  label: ReactNode;
  name: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="font-semibold">
        {label}
        {required && <span aria-hidden className="ml-1 text-bad">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="text-sm font-semibold text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const controlClass =
  "min-h-12 w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-ink placeholder:text-muted/70 focus:border-brand aria-invalid:border-bad";

export function TextInput({
  invalid,
  className = "",
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      id={props.name}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.name}-error` : undefined}
      className={`${controlClass} ${className}`}
      {...props}
    />
  );
}

export function SelectInput({ invalid, ...props }: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      id={props.name}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.name}-error` : undefined}
      className={controlClass}
      {...props}
    />
  );
}

export function TextArea(props: ComponentProps<"textarea">) {
  return <textarea id={props.name} rows={3} className={controlClass} {...props} />;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "good" | "bad"; children: ReactNode }) {
  const tones = {
    info: "border-brand bg-brand-soft",
    good: "border-good bg-good-soft",
    bad: "border-bad bg-bad-soft text-bad",
  };
  return (
    <div role="status" className={`rounded-lg border-l-4 px-4 py-3 ${tones[tone]}`}>
      {children}
    </div>
  );
}

/** Two-column list of facts, the way a voucher or master is displayed in Tally. */
export function FactList({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col border-b border-line pb-2">
          <dt className="text-sm text-muted">{item.label}</dt>
          <dd className="text-lg font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
