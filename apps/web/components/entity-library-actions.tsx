"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Plus } from "@/components/ui/icons";
import {
  type EntityLibraryState,
  getNextEntityLibraryState,
} from "@/lib/library/entity-library";
import { toastActionError, toastActionSuccess, toastAuthRequired } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import {
  entityLibraryKeys,
  mutateEntityLibraryItem,
  setEntityLibraryState,
  type EntityLibraryMutationEntity,
} from "@/queries/entity-library";

type EntityLibraryActionsProps = {
  entity: EntityLibraryMutationEntity;
  initialState: EntityLibraryState;
  isAuthenticated: boolean;
  className?: string;
};

export default function EntityLibraryActions({
  entity,
  initialState,
  isAuthenticated,
  className,
}: EntityLibraryActionsProps) {
  const queryClient = useQueryClient();
  const stateKey = entity.id ? entityLibraryKeys.state(entity.id) : null;
  const [localState, setLocalState] = useState(initialState);
  const mutation = useMutation({
    mutationFn: mutateEntityLibraryItem,
    onSuccess: (result) => {
      setLocalState((current) =>
        getNextEntityLibraryState(current, result.itemType, result.active),
      );
      setEntityLibraryState(queryClient, result.entityId, result.itemType, result.active);
      toastActionSuccess(result.active ? "Added to library" : "Removed from library");
    },
    onError: (error, variables) => {
      setLocalState((current) =>
        getNextEntityLibraryState(current, variables.itemType, !variables.active),
      );
      setEntityLibraryState(queryClient, entity.id, variables.itemType, !variables.active);
      toastActionError(error, "We could not update your library right now.");
    },
  });

  const renderedState = useMemo(() => {
    if (!stateKey) {
      return localState;
    }

    return queryClient.getQueryData<EntityLibraryState>(stateKey) ?? localState;
  }, [localState, queryClient, stateKey]);

  function handleToggle() {
    if (!isAuthenticated) {
      toastAuthRequired("library");
      return;
    }

    const itemType = "library" as const;
    const active = !renderedState.library;
    setLocalState((current) => getNextEntityLibraryState(current, itemType, active));
    setEntityLibraryState(queryClient, entity.id, itemType, active);
    mutation.mutate({
      entity,
      itemType,
      active,
      source: "track:hero",
    });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 md:justify-start",
        className,
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={mutation.isPending}
        aria-pressed={renderedState.library}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.72rem] font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
          renderedState.library
            ? "border-foreground/55 bg-foreground text-background"
            : "border-border/24 bg-card/18 text-muted-foreground hover:border-border/45 hover:bg-card/30 hover:text-foreground",
        )}
      >
        {renderedState.library ? (
          <Bookmark className="size-3.5" aria-hidden="true" />
        ) : (
          <Plus className="size-3.5" aria-hidden="true" />
        )}
        <span>{renderedState.library ? "In library" : "Add to library"}</span>
      </button>
    </div>
  );
}
