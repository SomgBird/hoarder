import type { ReactNode } from "react";
import type { AuthorCreditRead, CompanyCreditRead } from "@types";

// One label/value line in the Info table.
export type Row = { label: string; value: ReactNode };

// Empty values (null, undefined, "", []) are not worth a row.
export function isEmpty(value: ReactNode): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

// Group credits by role so we get "Author: A, B" / "Illustrator: C"
// instead of one flat "Authors" row.
export function groupByRole<T extends AuthorCreditRead | CompanyCreditRead>(
  credits: T[],
  getName: (credit: T) => string,
): Row[] {
  const groups = new Map<string, string[]>();
  for (const credit of credits) {
    const names = groups.get(credit.role.name) ?? [];
    names.push(getName(credit));
    groups.set(credit.role.name, names);
  }
  return [...groups].map(([label, names]) => ({
    label,
    value: names.join(", "),
  }));
}