"use client";

import { createContext, useContext, useMemo, useState, type ReactNode, type SetStateAction } from "react";
import type { NewReviewFormProps, NewReviewFormStep } from "./new-review-form";

type ComposerState = {
  step: NewReviewFormStep;
  query: string;
  selected: NonNullable<NewReviewFormProps["initialSelection"]> | null;
  activeResultState: { key: string; index: number };
  rating: number | null;
  title: string;
  body: string;
  composeSuggestionSeed: string;
  errorMsg: string | null;
  fieldErrors: {
    selected?: string;
    rating?: string;
    review_title?: string;
    review_body?: string;
  };
  saving: boolean;
};

export function getReviewComposerKey(props: NewReviewFormProps) {
  const selection = props.initialSelection;
  return JSON.stringify([
    props.mode ?? "create", props.intent ?? "review", props.reviewId ?? "",
    props.initialQuery ?? "", selection?.provider, selection?.provider_id,
    selection?.entity_id, selection?.title, selection?.artist_name,
    props.initialRating, props.initialTitle ?? "", props.initialBody ?? "",
    props.initialPinned ?? false,
  ]);
}

function createComposerState(props: NewReviewFormProps): ComposerState {
  const isSearchIntent = props.intent === "search" && !(props.mode === "edit" && props.reviewId);
  return {
    step: isSearchIntent ? "search" : props.initialSelection ? "compose" : "search",
    query: props.initialQuery ?? "",
    selected: props.initialSelection ?? null,
    activeResultState: { key: "", index: -1 },
    rating: props.initialRating ?? null,
    title: props.initialTitle ?? "",
    body: props.initialBody ?? "",
    composeSuggestionSeed: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10),
    errorMsg: null,
    fieldErrors: {},
    saving: false,
  };
}

type ComposerSetters = {
  [Key in Exclude<keyof ComposerState, "composeSuggestionSeed"> as `set${Capitalize<Key>}`]: (value: SetStateAction<ComposerState[Key]>) => void;
};

const ComposerContext = createContext<(ComposerState & ComposerSetters) | null>(null);

export function useOptionalReviewComposerSession() {
  return useContext(ComposerContext);
}

export function useReviewComposerSession() {
  const session = useOptionalReviewComposerSession();
  if (!session) throw new Error("Review form requires a composer session.");
  return session;
}

export function ReviewComposerSession({
  open,
  initial,
  children,
}: {
  open: boolean;
  initial: NewReviewFormProps;
  children: ReactNode;
}) {
  const key = getReviewComposerKey(initial);
  const [record, setRecord] = useState(() => ({
    open, key, id: 0,
    state: open ? createComposerState(initial) : null,
  }));

  if (open && (!record.open || record.key !== key)) {
    setRecord({ open, key, id: record.id + 1, state: createComposerState(initial) });
  } else if (!open && record.open) {
    setRecord({ ...record, open: false });
  }

  const setters = useMemo(() => {
    function setter<Key extends keyof ComposerState>(field: Key) {
      return (value: SetStateAction<ComposerState[Key]>) => {
        setRecord((current) => {
          if (!current.state || current.id !== record.id) return current;
          const next = typeof value === "function" ? value(current.state[field]) : value;
          if (Object.is(current.state[field], next)) return current;
          return { ...current, state: { ...current.state, [field]: next } };
        });
      };
    }
    return {
      setStep: setter("step"), setQuery: setter("query"),
      setSelected: setter("selected"), setActiveResultState: setter("activeResultState"),
      setRating: setter("rating"), setTitle: setter("title"), setBody: setter("body"),
      setErrorMsg: setter("errorMsg"), setFieldErrors: setter("fieldErrors"), setSaving: setter("saving"),
    } satisfies ComposerSetters;
  }, [record.id]);

  const value = useMemo(
    () => record.state ? { ...record.state, ...setters } : null,
    [record.state, setters],
  );

  return <ComposerContext value={value}>{children}</ComposerContext>;
}
