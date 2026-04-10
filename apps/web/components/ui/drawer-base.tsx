"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cn } from "@/lib/utils";

type DrawerBaseDirection = NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>;
type DrawerBaseClassName<State> =
  | string
  | ((state: State) => string | undefined)
  | undefined;

const DrawerBaseDirectionContext = React.createContext<DrawerBaseDirection>("down");

function resolveClassName<State>(
  className: DrawerBaseClassName<State>,
  state: State,
) {
  return typeof className === "function" ? className(state) : className;
}

function DrawerBaseProvider({
  ...props
}: DrawerPrimitive.Provider.Props) {
  return <DrawerPrimitive.Provider data-slot="drawer-base-provider" {...props} />;
}

function DrawerBase({
  swipeDirection = "down",
  ...props
}: DrawerPrimitive.Root.Props) {
  return (
    <DrawerBaseDirectionContext.Provider value={swipeDirection}>
      <DrawerPrimitive.Root
        data-slot="drawer-base"
        swipeDirection={swipeDirection}
        {...props}
      />
    </DrawerBaseDirectionContext.Provider>
  );
}

function DrawerBaseTrigger({
  ...props
}: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-base-trigger" {...props} />;
}

function DrawerBasePortal({
  className,
  ...props
}: DrawerPrimitive.Portal.Props) {
  return (
    <DrawerPrimitive.Portal
      data-slot="drawer-base-portal"
      className={(state) =>
        cn(
          "fixed inset-0 z-50",
          resolveClassName(className, state),
        )}
      {...props}
    />
  );
}

function DrawerBaseClose({
  ...props
}: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-base-close" {...props} />;
}

function getDrawerBaseContentClassName(state: DrawerPrimitive.Popup.State) {
  const isVertical = state.swipeDirection === "down" || state.swipeDirection === "up";
  const isHorizontal = state.swipeDirection === "left" || state.swipeDirection === "right";

  return cn(
    "group/drawer-base-popup pointer-events-auto relative flex flex-col overflow-hidden bg-background text-foreground shadow-2xl outline-none transition-[transform,opacity,border-radius] duration-200 ease-out data-swiping:duration-0 data-starting-style:opacity-0 data-ending-style:opacity-0",
    isVertical && "w-full",
    isHorizontal && "h-full max-w-[min(24rem,calc(100vw-0.75rem))]",
    state.swipeDirection === "down" &&
      "mt-auto max-h-[calc(100dvh-0.25rem)] rounded-t-[1.65rem] border border-border/34 border-b-0 data-starting-style:translate-y-8 data-ending-style:translate-y-8",
    state.swipeDirection === "up" &&
      "mb-auto max-h-[calc(100dvh-0.25rem)] rounded-b-[1.65rem] border border-border/34 border-t-0 data-starting-style:-translate-y-8 data-ending-style:-translate-y-8",
    state.swipeDirection === "right" &&
      "ml-auto w-[min(24rem,calc(100vw-0.75rem))] rounded-l-[1.65rem] border border-border/34 border-r-0 data-starting-style:translate-x-8 data-ending-style:translate-x-8",
    state.swipeDirection === "left" &&
      "mr-auto w-[min(24rem,calc(100vw-0.75rem))] rounded-r-[1.65rem] border border-border/34 border-l-0 data-starting-style:-translate-x-8 data-ending-style:-translate-x-8",
    state.nested &&
      state.swipeDirection === "down" &&
      "mx-1.5 mb-1.5 max-h-[calc(100dvh-0.5rem)] rounded-[1.45rem] border-b border-border/44",
    state.nested &&
      state.swipeDirection === "up" &&
      "mx-1.5 mt-1.5 max-h-[calc(100dvh-0.5rem)] rounded-[1.45rem] border-t border-border/44",
    state.nested &&
      state.swipeDirection === "right" &&
      "my-1.5 mr-1.5 rounded-[1.45rem] border-r border-border/44",
    state.nested &&
      state.swipeDirection === "left" &&
      "my-1.5 ml-1.5 rounded-[1.45rem] border-l border-border/44",
    state.nestedDrawerOpen &&
      state.swipeDirection === "down" &&
      "scale-[0.985] -translate-y-3 rounded-[1.45rem]",
    state.nestedDrawerOpen &&
      state.swipeDirection === "up" &&
      "scale-[0.985] translate-y-3 rounded-[1.45rem]",
    state.nestedDrawerOpen &&
      state.swipeDirection === "right" &&
      "scale-[0.985] -translate-x-3 rounded-[1.45rem]",
    state.nestedDrawerOpen &&
      state.swipeDirection === "left" &&
      "scale-[0.985] translate-x-3 rounded-[1.45rem]",
  );
}

function DrawerBaseContent({
  className,
  ...props
}: DrawerPrimitive.Popup.Props) {
  return (
    <DrawerPrimitive.Popup
      data-slot="drawer-base-content"
      className={(state) =>
        cn(
          getDrawerBaseContentClassName(state),
          resolveClassName(className, state),
        )}
      {...props}
    />
  );
}

function DrawerBaseBackdrop({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-base-backdrop"
      className={(state) =>
        cn(
          "absolute inset-0 bg-black/80 transition-opacity duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
          resolveClassName(className, state),
        )}
      {...props}
    />
  );
}

function DrawerBaseViewport({
  className,
  ...props
}: DrawerPrimitive.Viewport.Props) {
  const swipeDirection = React.useContext(DrawerBaseDirectionContext);

  return (
    <DrawerPrimitive.Viewport
      data-slot="drawer-base-viewport"
      className={(state) =>
        cn(
          "absolute inset-0 flex",
          swipeDirection === "down" && "items-end justify-center",
          swipeDirection === "up" && "items-start justify-center",
          swipeDirection === "right" && "items-stretch justify-end p-1.5",
          swipeDirection === "left" && "items-stretch justify-start p-1.5",
          resolveClassName(className, state),
        )}
      {...props}
    />
  );
}

function DrawerBaseHandle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const swipeDirection = React.useContext(DrawerBaseDirectionContext);

  if (swipeDirection === "left" || swipeDirection === "right") {
    return null;
  }

  return (
    <div
      data-slot="drawer-base-handle"
      className={cn(
        "mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted-foreground/30",
        className,
      )}
      {...props}
    />
  );
}

function DrawerBaseHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const swipeDirection = React.useContext(DrawerBaseDirectionContext);

  return (
    <div
      data-slot="drawer-base-header"
      className={cn(
        "flex flex-col gap-1 px-4 py-3",
        (swipeDirection === "down" || swipeDirection === "up") && "text-center",
        className,
      )}
      {...props}
    />
  );
}

function DrawerBaseFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-base-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DrawerBaseTitle({
  className,
  ...props
}: DrawerPrimitive.Title.Props) {
  const swipeDirection = React.useContext(DrawerBaseDirectionContext);

  return (
    <DrawerPrimitive.Title
      data-slot="drawer-base-title"
      className={(state) =>
        cn(
          "font-heading text-sm font-medium text-foreground",
          (swipeDirection === "down" || swipeDirection === "up") && "text-center",
          resolveClassName(className, state),
        )}
      {...props}
    />
  );
}

function DrawerBaseDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  const swipeDirection = React.useContext(DrawerBaseDirectionContext);

  return (
    <DrawerPrimitive.Description
      data-slot="drawer-base-description"
      className={(state) =>
        cn(
          "text-xs/relaxed text-muted-foreground",
          (swipeDirection === "down" || swipeDirection === "up") && "text-center",
          resolveClassName(className, state),
        )}
      {...props}
    />
  );
}

export {
  DrawerBase,
  DrawerBaseBackdrop,
  DrawerBaseClose,
  DrawerBaseContent,
  DrawerBaseDescription,
  DrawerBaseFooter,
  DrawerBaseHandle,
  DrawerBaseHeader,
  DrawerBasePortal,
  DrawerBaseProvider,
  DrawerBaseTitle,
  DrawerBaseTrigger,
  DrawerBaseViewport,
};
