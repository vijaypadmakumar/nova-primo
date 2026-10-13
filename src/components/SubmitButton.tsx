"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, Kbd } from "./ui";

export function SubmitButton({
  children,
  pendingText,
  shortcut,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  shortcut?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant)}>
      {pending && pendingText ? pendingText : children}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </button>
  );
}
