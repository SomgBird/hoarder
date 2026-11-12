import { createContext, useEffect, useState } from "react";
import {
  referenceService, REFERENCE_RESOURCES, type ReferenceEntity,
  type ReferenceResource, type CreatableReference,
} from "../../../services/referenceService";
import type { ItemType } from "@types";

export interface ReferenceOption { value: string; label: string }
type Options = Record<ReferenceResource, ReferenceOption[]>;
const EMPTY = Object.fromEntries(REFERENCE_RESOURCES.map((resource) => [resource, [] as ReferenceOption[]])) as Options;

function option(resource: ReferenceResource, entity: ReferenceEntity): ReferenceOption {
  if ("code" in entity) return { value: entity.code, label: `${entity.name} (${entity.code})` };
  if ("scale" in entity) return { value: String(entity.id), label: entity.scale };
  return {
    value: resource === "tags" || resource.endsWith("-roles") ? entity.name : String(entity.id),
    label: entity.name,
  };
}

export function useReferenceData(itemType: ItemType | null) {
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(0);
  const key = `${itemType}:${attempt}`;
  const [result, setResult] = useState<{ key: string; options: Options; error?: string } | null>(null);
  const current = result?.key === key ? result : null;

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(REFERENCE_RESOURCES.map(async (resource) => [
      resource,
      (await referenceService.list(resource, itemType ?? undefined, controller.signal))
        .map((entity) => option(resource, entity))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ])).then((entries) => {
      if (!controller.signal.aborted) setResult({ key, options: Object.fromEntries(entries) as Options });
    }).catch((error) => {
      if (!controller.signal.aborted) setResult({ key, options: EMPTY, error: error instanceof Error ? error.message : "Could not load reference lists." });
    });
    return () => controller.abort();
  }, [itemType, key]);

  const create = async (resource: CreatableReference, name: string) => {
    setPending((count) => count + 1);
    try {
      const entity = await referenceService.create(resource, {
        name,
        ...(resource === "formats" || resource === "genres" ? { item_type: itemType } : {}),
      });
      const added = option(resource, entity);
      setResult((previous) => previous?.key === key ? {
        ...previous,
        options: {
          ...previous.options,
          [resource]: [...previous.options[resource].filter((entry) => entry.value !== added.value), added]
            .sort((a, b) => a.label.localeCompare(b.label)),
        },
      } : previous);
      return added;
    } finally {
      setPending((count) => count - 1);
    }
  };

  return { options: current?.options ?? EMPTY, loading: !current, error: current?.error,
    pending, create, retry: () => setAttempt((value) => value + 1) };
}

export const ReferenceContext = createContext<ReturnType<typeof useReferenceData> | null>(null);
