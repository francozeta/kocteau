"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import type { AnimationPlaybackControls } from "motion/react";
import {
  KocteauHomeIcon,
  KocteauLibraryIcon,
  KocteauReviewsIcon,
  KocteauSearchIcon,
} from "@/components/icons/kocteau-icons";
import s from "./sidebar-motion-lab.module.css";

// An isolated geometry lab. Never mount the production AppShell or duplicate
// its SidebarProvider/portals. The fixed, viewport-sized foreground owns its
// scrollable content, header and dock: all three move as a single physical surface.
const pages = [
  { key: "Feed", Icon: KocteauHomeIcon },
  { key: "Search", Icon: KocteauSearchIcon },
  { key: "Reviews", Icon: KocteauReviewsIcon },
  { key: "Library", Icon: KocteauLibraryIcon },
] as const;
type Page = (typeof pages)[number]["key"];
type Entrance = "stationary" | "subtle";

const subscribeResize = (notify: () => void) => {
  window.addEventListener("resize", notify);
  return () => window.removeEventListener("resize", notify);
};
const viewportWidth = () => window.innerWidth;
const serverWidth = () => 390;
const subscribeReduce = (notify: () => void) => {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", notify);
  return () => q.removeEventListener("change", notify);
};
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverReduced = () => false;

export default function SidebarMotionLab() {
  const width = useSyncExternalStore(subscribeResize, viewportWidth, serverWidth);
  const reduceMotion = useSyncExternalStore(subscribeReduce, reduced, serverReduced);
  const distance = Math.max(0, Math.min(width - 76, 304));
  const [page, setPage] = useState<Page>("Feed");
  const [open, setOpen] = useState(false);
  const [entrance, setEntrance] = useState<Entrance>("stationary");
  const progress = useMotionValue(0);
  const running = useRef<AnimationPlaybackControls | null>(null);
  const gestureStart = useRef(0);
  const didDrag = useRef(false);

  const x = useTransform(progress, (value) => value * distance);
  const radius = useTransform(progress, [0, 1], [0, 22]);
  const depth = useTransform(progress, [0, 1], [0, 1]);
  const menuX = useTransform(progress, [0, 1], [-12, 0]);

  function move(next: boolean) {
    running.current?.stop();
    setOpen(next);
    if (reduceMotion) {
      progress.set(next ? 1 : 0);
    } else {
      running.current = animate(progress, next ? 1 : 0, {
        type: "spring",
        stiffness: 310,
        damping: 39,
        mass: 1,
      });
    }
  }

  useEffect(() => {
    if (!reduceMotion) return;
    running.current?.stop();
    progress.set(open ? 1 : 0);
  }, [reduceMotion, open, progress]);

  const navigate = (next: Page) => {
    setPage(next);
    move(false);
  };

  return (
    <div className={s.stage} data-sidebar-lab>
      <nav
        className={s.sidebar}
        aria-label="Experimental underlay navigation"
        aria-hidden={!open}
        inert={!open}
        style={{ width: Math.max(0, distance - 14) }}
      >
        <motion.div className={s.sidebarInterior} style={entrance === "subtle" ? { x: menuX } : undefined}>
          <div className={s.brand}>K <span>kocteau / lab</span></div>
          <p className={s.group}>Listen</p>
          {pages.map(({ key, Icon }) => (
            <button key={key} type="button" onClick={() => navigate(key)}
              className={s.sideItem} aria-current={page === key ? "page" : undefined}>
              <Icon className={s.icon}/><span>{key}</span>
            </button>
          ))}
          <div className={s.bottom}>
            <div className={s.divider}/>
            <p className={s.group}>Test entrance</p>
            <div className={s.choices} role="group" aria-label="Sidebar entrance">
              <button type="button" aria-pressed={entrance === "stationary"}
                onClick={() => setEntrance("stationary")}>Stationary</button>
              <button type="button" aria-pressed={entrance === "subtle"}
                onClick={() => setEntrance("subtle")}>12px</button>
            </div>
            <p className={s.hint}>Only the entrance changes. The shell and dock always share one transform.</p>
          </div>
        </motion.div>
      </nav>

      <motion.section
        className={s.foreground}
        initial={false}
        style={{ x, borderTopLeftRadius: radius, borderBottomLeftRadius: radius }}
        aria-label="Persistent foreground"
      >
        <motion.div className={s.depth} aria-hidden="true" style={{ opacity: depth }}/>
        <header className={s.header}>
          <motion.button
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-controls="sidebar-lab-list"
            aria-expanded={open}
            className={s.menuButton}
            style={{ touchAction: "pan-y" }}
            onPanStart={() => {
              didDrag.current = true;
              gestureStart.current = progress.get();
              running.current?.stop();
            }}
            onPan={(_, info) => {
              if (distance <= 0) return;
              progress.set(Math.max(0, Math.min(1, gestureStart.current + info.offset.x / distance)));
            }}
            onPanEnd={(_, info) => {
              const next = info.velocity.x > 500 ? true
                : info.velocity.x < -500 ? false
                : progress.get() > 0.5;
              move(next);
            }}
            onClick={() => {
              if (didDrag.current) {
                didDrag.current = false;
                return;
              }
              move(!open);
            }}
          >
            <span/><span/><span/>
          </motion.button>
          <span className={s.headerLabel}>kocteau <span>— {page.toLowerCase()}</span></span>
          <span className={s.pill}>LAB</span>
        </header>

        <div className={s.scroll} tabIndex={-1}>
          <div className={s.content}>
            <p className={s.eyebrow}>Experimento aislado / interfaz</p>
            <h1>{page === "Feed" ? "Music, without interruption." : page}</h1>
            <p className={s.description}>
              This is a mock surface, not a production feed. Open the menu, reverse
              before it finishes, drag the menu icon and scroll the page.
              The header and bottom bar must stay attached to this same layer.
            </p>
            <div className={s.grid}>
              <article className={s.album}><div className={s.artworkOne}>01</div><p>Selected frequency</p><small>Listening study</small></article>
              <article className={s.album}><div className={s.artworkTwo}>02</div><p>Where we return</p><small>Listening study</small></article>
              <article className={s.album}><div className={s.artworkThree}>03</div><p>Quiet motion</p><small>Listening study</small></article>
              <article className={s.album}><div className={s.artworkFour}>04</div><p>Spatial identity</p><small>Listening study</small></article>
            </div>
            <div className={s.notes}><strong>Geometry checklist</strong>
              <p>One 100dvh shell · Inner scroll · No portal · No duplicate transforms · No real user data · Reduced-motion fallback.</p>
            </div>
          </div>
        </div>

        <footer className={s.dockWrap}>
          <div className={s.dock} aria-label="Experimental persistent bottom bar">
            {pages.map(({ key, Icon }) => (
              <button type="button" key={key} onClick={() => navigate(key)}
                aria-label={key} aria-current={page === key ? "page" : undefined}>
                <Icon className={s.icon}/>
              </button>
            ))}
          </div>
        </footer>
        {open && <button type="button" className={s.dismiss}
          aria-label="Dismiss navigation" onClick={() => move(false)}/>}
      </motion.section>
      <div id="sidebar-lab-list" className={s.srOnly}>Sidebar navigation labels: Feed, Search, Reviews, Library.</div>
    </div>
  );
}
