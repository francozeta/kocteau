"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Music2 } from "@/components/ui/icons";
import {
  type EntityLibraryItemType,
  type EntityLibraryState,
  getEntityLibraryItemLabel,
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

const libraryActions: Array<{
  itemType: EntityLibraryItemType;
  icon: typeof Music2;
}> = [
  {
    itemType: "listen_later",
    icon: Music2,
  },
  {
    itemType: "review_later",
    icon: Bookmark,
  },
];

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
      toastActionSuccess(
        result.active
          ? `${getEntityLibraryItemLabel(result.itemType)} saved`
          : `${getEntityLibraryItemLabel(result.itemType)} removed`,
      );
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

  function handleToggle(itemType: EntityLibraryItemType) {
    if (!isAuthenticated) {
      toastAuthRequired("library");
      return;
    }

    const active = !renderedState[itemType];
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
      {libraryActions.map(({ itemType, icon: Icon }) => {
        const active = renderedState[itemType];
        const label = getEntityLibraryItemLabel(itemType);

        return (
          <button
            key={itemType}
            type="button"
            onClick={() => handleToggle(itemType)}
            disabled={mutation.isPending}
            aria-pressed={active}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.72rem] font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
              active
                ? "border-foreground/55 bg-foreground text-background"
                : "border-border/24 bg-card/18 text-muted-foreground hover:border-border/45 hover:bg-card/30 hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
