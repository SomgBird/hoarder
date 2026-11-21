import type { ComponentProps } from "react";
import { helpPageUrl, type HelpPage } from "@config/help";

type Props = Omit<ComponentProps<"a">, "href" | "onClick"> & {
  page: HelpPage;
  standalone: boolean;
  onNavigate: (page: HelpPage) => void;
};

export function HelpLink({ page, standalone, onNavigate, ...props }: Props) {
  return <a {...props} href={helpPageUrl(page, standalone)} onClick={(event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || (props.target && props.target !== "_self") || props.download !== undefined) return;
    event.preventDefault();
    onNavigate(page);
  }} />;
}
