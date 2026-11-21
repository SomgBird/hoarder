import { TitleBar } from "@react95/core";
import { HELP_TOPICS, helpUrl, type HelpTopicId } from "@config/help";

export function HelpButton({ topic, label }: { topic: HelpTopicId; label?: string }) {
  return <TitleBar.Help as="a" href={helpUrl(topic, true)} target="hoarder-help"
    aria-label={label ?? `Help: ${HELP_TOPICS[topic]}`} title={`${HELP_TOPICS[topic]} (opens in a Help window)`} />;
}
