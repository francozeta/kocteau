"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./discovery-interface.module.css";

export default function DiscoveryResultList({
  children,
  id,
}: {
  children: ReactNode;
  id: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (!scroll || !content) return;

    const updateEdges = () => {
      scroll.dataset.moreBefore = String(scroll.scrollTop > 1);
      scroll.dataset.moreAfter = String(
        scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop > 1,
      );
    };
    const observer = new ResizeObserver(updateEdges);
    observer.observe(scroll);
    observer.observe(content);
    scroll.addEventListener("scroll", updateEdges, { passive: true });
    updateEdges();
    return () => {
      observer.disconnect();
      scroll.removeEventListener("scroll", updateEdges);
    };
  }, []);

  return (
    <div ref={scrollRef} className={styles.resultsScroll}>
      <div ref={contentRef} id={id} className="grid gap-0.5 p-2">
        {children}
      </div>
    </div>
  );
}
