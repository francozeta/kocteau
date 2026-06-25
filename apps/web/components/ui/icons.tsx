import {
  forwardRef,
  useId,
  type ForwardRefExoticComponent,
  type RefAttributes,
  type SVGProps,
} from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArchiveIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowTurnForwardIcon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  Bookmark02Icon,
  Camera01Icon,
  Cancel01Icon,
  ChatIcon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  Delete02Icon,
  DiscThreeIcon,
  FavouriteIcon,
  Flag01Icon,
  Home01Icon,
  InformationCircleIcon,
  Link04Icon,
  Loading03Icon,
  Menu01Icon,
  Message01Icon,
  MessageAdd01Icon,
  MinusSignIcon,
  MoreHorizontalIcon,
  MusicNote03Icon,
  Notification01Icon,
  OctagonXIcon,
  PencilEdit01Icon,
  PencilIcon,
  PinIcon,
  PlusSignIcon,
  QuoteUpIcon,
  RecordIcon,
  Search01Icon,
  SentIcon,
  Settings02Icon,
  Share08Icon,
  SidebarLeftIcon,
  SparklesIcon,
  StarIcon as HugeStarIcon,
  TagsIcon,
  Tick02Icon,
  TriangleIcon,
  UnfoldMoreIcon,
  UserAdd01Icon,
  UserCheck01Icon,
  UserCircleIcon as HugeUserCircleIcon,
  UserGroupIcon,
  Logout03Icon,
} from "@hugeicons/core-free-icons";

type IconWeight =
  | "thin"
  | "light"
  | "regular"
  | "bold"
  | "fill"
  | "duotone";

type HugeIconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: string | number;
  weight?: IconWeight;
  absoluteStrokeWidth?: boolean;
};

export type Icon = ForwardRefExoticComponent<
  HugeIconProps & RefAttributes<SVGSVGElement>
>;

function strokeWidthForWeight(weight?: IconWeight) {
  if (weight === "thin") return 1.1;
  if (weight === "light") return 1.3;
  if (weight === "bold" || weight === "fill") return 1.9;
  return 1.5;
}

function createIcon(icon: IconSvgElement, displayName: string): Icon {
  const Component = forwardRef<SVGSVGElement, HugeIconProps>(
    ({ weight, strokeWidth, absoluteStrokeWidth = true, ...props }, ref) => (
      <HugeiconsIcon
        ref={ref}
        icon={icon}
        strokeWidth={
          typeof strokeWidth === "number" ? strokeWidth : strokeWidthForWeight(weight)
        }
        absoluteStrokeWidth={absoluteStrokeWidth}
        {...props}
      />
    ),
  );

  Component.displayName = displayName;

  return Component;
}

function useSignalGlassIds(prefix: string) {
  const id = useId().replace(/:/g, "");

  return {
    dark: `${prefix}-dark-${id}`,
    soft: `${prefix}-soft-${id}`,
    light: `${prefix}-light-${id}`,
    filter: `${prefix}-filter-${id}`,
    clip: `${prefix}-clip-${id}`,
    mask: `${prefix}-mask-${id}`,
  };
}

function SignalGlassDefs({
  ids,
  clipPath,
  maskPath,
}: {
  ids: ReturnType<typeof useSignalGlassIds>;
  clipPath: string;
  maskPath: string;
}) {
  return (
    <defs>
      <linearGradient id={ids.dark} x1="12" y1="0.75" x2="12" y2="23.25" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgba(87, 87, 87, 1)" />
        <stop offset="1" stopColor="rgba(21, 21, 21, 1)" />
      </linearGradient>
      <linearGradient id={ids.soft} x1="12" y1="0.75" x2="12" y2="23.25" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgba(227, 227, 229, 0.62)" />
        <stop offset="1" stopColor="rgba(187, 187, 192, 0.58)" />
      </linearGradient>
      <linearGradient id={ids.light} x1="12" y1="0.75" x2="12" y2="13.75" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgba(255, 255, 255, 1)" />
        <stop offset="1" stopColor="rgba(255, 255, 255, 0)" />
      </linearGradient>
      <filter
        id={ids.filter}
        x="-100%"
        y="-100%"
        width="400%"
        height="400%"
        filterUnits="objectBoundingBox"
        primitiveUnits="userSpaceOnUse"
      >
        <feGaussianBlur stdDeviation="2" in="SourceGraphic" edgeMode="none" result="blur" />
      </filter>
      <clipPath id={ids.clip}>
        <path d={clipPath} />
      </clipPath>
      <mask id={ids.mask}>
        <rect width="100%" height="100%" fill="#fff" />
        <path d={maskPath} fill="#000" />
      </mask>
    </defs>
  );
}

export const TrackDiscIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ strokeWidth = 1.5, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth={strokeWidth} />
      <path
        d="M10.2473 6.26025C8.3406 6.84176 6.83684 8.3473 6.25781 10.2551M17.7418 13.7472C17.1622 15.6544 15.6584 17.1594 13.7518 17.7404"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
      <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  ),
);
TrackDiscIcon.displayName = "TrackDiscIcon";

export const AlbumStackIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ strokeWidth = 1.5, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M18.25 3.75H5.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M19.25 7.75H4.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M5.78879 11.75H18.2112C19.5052 11.75 20.4586 12.9602 20.1556 14.2182L19.072 18.7182C18.8556 19.6168 18.0518 20.25 17.1276 20.25H6.87243C5.94823 20.25 5.14438 19.6168 4.92801 18.7182L3.84437 14.2182C3.54143 12.9602 4.49479 11.75 5.78879 11.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  ),
);
AlbumStackIcon.displayName = "AlbumStackIcon";

export const SignalGenreIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) => {
    const ids = useSignalGlassIds("signal-genre");
    const basePath =
      "M6 13.8L6 17.2C6 18.8802 6 19.7202 6.32698 20.362C6.6146 20.9265 7.07354 21.3854 7.63803 21.673C8.27976 22 9.11984 22 10.8 22H16.6745C17.1637 22 17.4083 22 17.6385 21.9447C17.8425 21.8957 18.0376 21.8149 18.2166 21.7053C18.4184 21.5816 18.5914 21.4086 18.9373 21.0627L22.2373 17.7627C23.0293 16.9707 23.4253 16.5747 23.5737 16.118C23.7042 15.7163 23.7042 15.2837 23.5737 14.882C23.4253 14.4253 23.0293 14.0293 22.2373 13.2373L18.9373 9.93726C18.5914 9.59135 18.4184 9.4184 18.2166 9.29472C18.0376 9.18506 17.8425 9.10425 17.6385 9.05526C17.4083 9 17.1637 9 16.6745 9L10.8 9C9.11984 9 8.27976 9 7.63803 9.32698C7.07354 9.6146 6.6146 10.0735 6.32698 10.638C6 11.2798 6 12.1198 6 13.8Z";
    const topPath =
      "M17.9999 6.8L17.9999 10.2C17.9999 11.8802 17.9999 12.7202 17.673 13.362C17.3853 13.9265 16.9264 14.3854 16.3619 14.673C15.7202 15 14.8801 15 13.1999 15H7.32543C6.83624 15 6.59165 15 6.36148 14.9447C6.15741 14.8957 5.96232 14.8149 5.78337 14.7053C5.58154 14.5816 5.40859 14.4086 5.06268 14.0627L1.76268 10.7627C0.97065 9.97071 0.574633 9.57469 0.426256 9.11803C0.29574 8.71635 0.29574 8.28365 0.426256 7.88197C0.574633 7.42531 0.970651 7.02929 1.76269 6.23726L5.06269 2.93726C5.40859 2.59135 5.58154 2.4184 5.78337 2.29472C5.96232 2.18506 6.15741 2.10425 6.36148 2.05526C6.59166 2 6.83625 2 7.32543 2L13.1999 2C14.8801 2 15.7202 2 16.3619 2.32698C16.9264 2.6146 17.3853 3.07354 17.673 3.63803C17.9999 4.27976 17.9999 5.11984 17.9999 6.8Z";

    return (
      <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d={basePath} fill={`url(#${ids.dark})`} mask={`url(#${ids.mask})`} />
        <path d={basePath} fill={`url(#${ids.dark})`} filter={`url(#${ids.filter})`} clipPath={`url(#${ids.clip})`} />
        <path d={topPath} fill={`url(#${ids.soft})`} />
        <path d={topPath} fill={`url(#${ids.light})`} opacity="0.82" />
        <SignalGlassDefs ids={ids} clipPath={topPath} maskPath={topPath} />
      </svg>
    );
  },
);
SignalGenreIcon.displayName = "SignalGenreIcon";

export const SignalMoodIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) => {
    const ids = useSignalGlassIds("signal-mood");
    const smilePath =
      "M15.4619 13.3887C16.0866 13.2312 16.7389 13.3777 17.2109 13.7676C17.7062 14.1768 17.989 14.8548 17.7871 15.5908C17.0899 18.1317 14.7641 20 12 20C9.23911 20 6.91604 18.1359 6.21582 15.5996C6.01221 14.8618 6.29551 14.182 6.79297 13.7725C7.26683 13.3825 7.92135 13.2374 8.54688 13.3975C11.0547 14.0391 12.8352 14.0508 15.4619 13.3887Z";
    const facePath =
      "M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1ZM16.8223 15.3262C16.9993 14.6809 16.3548 14.1939 15.7061 14.3574C12.9196 15.0599 10.9702 15.0497 8.29883 14.3662C7.64852 14.1999 7.00122 14.6859 7.17969 15.333C7.76311 17.4472 9.70024 19 12 19C14.3023 19 16.2412 17.444 16.8223 15.3262ZM8 9C7.17157 9 6.5 9.67157 6.5 10.5C6.5 11.3284 7.17157 12 8 12C8.82843 12 9.5 11.3284 9.5 10.5C9.5 9.67157 8.82843 9 8 9ZM16 9C15.1716 9 14.5 9.67157 14.5 10.5C14.5 11.3284 15.1716 12 16 12C16.8284 12 17.5 11.3284 17.5 10.5C17.5 9.67157 16.8284 9 16 9Z";
    const eyeLeftPath = "M8 8.5C9.10457 8.5 10 9.39543 10 10.5C10 11.6046 9.10457 12.5 8 12.5C6.89543 12.5 6 11.6046 6 10.5C6 9.39543 6.89543 8.5 8 8.5Z";
    const eyeRightPath = "M16 8.5C17.1046 8.5 18 9.39543 18 10.5C18 11.6046 17.1046 12.5 16 12.5C14.8954 12.5 14 11.6046 14 10.5C14 9.39543 14.8954 8.5 16 8.5Z";

    return (
      <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d={smilePath} fill={`url(#${ids.dark})`} mask={`url(#${ids.mask})`} />
        <path d={smilePath} fill={`url(#${ids.dark})`} filter={`url(#${ids.filter})`} clipPath={`url(#${ids.clip})`} />
        <path d={eyeLeftPath} fill={`url(#${ids.dark})`} />
        <path d={eyeRightPath} fill={`url(#${ids.dark})`} />
        <path d={facePath} fill={`url(#${ids.soft})`} />
        <path d={facePath} fill={`url(#${ids.light})`} opacity="0.7" />
        <SignalGlassDefs ids={ids} clipPath={facePath} maskPath={facePath} />
      </svg>
    );
  },
);
SignalMoodIcon.displayName = "SignalMoodIcon";

export const SignalSceneIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) => {
    const ids = useSignalGlassIds("signal-scene");
    const basePath =
      "M9.12015 8.16C10.1529 7.38542 10.6693 6.99813 11.2364 6.84884C11.737 6.71706 12.2632 6.71705 12.7638 6.84883C13.331 6.99812 13.8474 7.38541 14.8801 8.15999L20.5868 12.44C21.7448 13.3085 22.3238 13.7427 22.5308 14.275C22.7122 14.7413 22.7122 15.2586 22.5308 15.7249C22.3238 16.2573 21.7448 16.6915 20.5868 17.56L14.8801 21.84C13.8474 22.6146 13.331 23.0019 12.7638 23.1512C12.2632 23.2829 11.737 23.2829 11.2364 23.1512C10.6693 23.0019 10.1529 22.6146 9.12014 21.84L3.41349 17.56C2.25552 16.6915 1.67654 16.2573 1.4695 15.7249C1.28816 15.2586 1.28816 14.7413 1.46951 14.275C1.67655 13.7427 2.25553 13.3085 3.41349 12.44L9.12015 8.16Z";
    const topPath =
      "M9.12015 2.15999C10.1529 1.38542 10.6693 0.998128 11.2364 0.848835C11.737 0.717055 12.2632 0.717055 12.7638 0.848834C13.331 0.998124 13.8474 1.38541 14.8801 2.15999L20.5868 6.43998C21.7448 7.30845 22.3238 7.74269 22.5308 8.27503C22.7122 8.74132 22.7122 9.25864 22.5308 9.72492C22.3238 10.2573 21.7448 10.6915 20.5868 11.56L14.8801 15.84C13.8474 16.6146 13.331 17.0019 12.7638 17.1512C12.2632 17.2829 11.737 17.2829 11.2364 17.1512C10.6693 17.0019 10.1529 16.6146 9.12014 15.84L3.41349 11.56C2.25552 10.6915 1.67654 10.2573 1.4695 9.72492C1.28816 9.25864 1.28816 8.74132 1.46951 8.27504C1.67655 7.74269 2.25553 7.30846 3.41349 6.43998L9.12015 2.15999Z";

    return (
      <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d={basePath} fill={`url(#${ids.dark})`} mask={`url(#${ids.mask})`} />
        <path d={basePath} fill={`url(#${ids.dark})`} filter={`url(#${ids.filter})`} clipPath={`url(#${ids.clip})`} />
        <path d={topPath} fill={`url(#${ids.soft})`} />
        <path d={topPath} fill={`url(#${ids.light})`} opacity="0.76" />
        <SignalGlassDefs ids={ids} clipPath={topPath} maskPath={topPath} />
      </svg>
    );
  },
);
SignalSceneIcon.displayName = "SignalSceneIcon";

export const SignalStyleIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) => {
    const ids = useSignalGlassIds("signal-style");
    const brushPath =
      "M12.0001 7.05612C12.0282 7.03799 15.0095 5.12181 17.0001 7.05612C18.9886 8.98851 17.0228 11.9218 17.0001 11.9555L8.95615 20.0005C7.83392 21.1226 6.1397 21.3216 4.81259 20.601L3.70712 21.7075C3.31669 22.0978 2.68356 22.0977 2.29306 21.7075C1.90259 21.317 1.90269 20.684 2.29306 20.2934L3.39951 19.186C2.68421 17.8601 2.88608 16.1702 4.00595 15.0503L12.0001 7.05612Z";
    const topPath =
      "M16.0288 3.02747C17.3956 1.66105 19.6113 1.66108 20.978 3.02747C22.3449 4.3943 22.3449 6.61083 20.978 7.97766L18.0386 10.9171L19.561 12.4396L19.6646 12.5538C20.1444 13.1429 20.1098 14.0117 19.561 14.5607C19.0121 15.1096 18.1433 15.144 17.5542 14.6642L17.4399 14.5607L9.43994 6.56067C8.85415 5.97488 8.85415 5.02536 9.43994 4.43958C10.0257 3.85394 10.9753 3.85384 11.561 4.43958L13.0884 5.96692L16.0288 3.02747Z";

    return (
      <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d={brushPath} fill={`url(#${ids.dark})`} mask={`url(#${ids.mask})`} />
        <path d={brushPath} fill={`url(#${ids.dark})`} filter={`url(#${ids.filter})`} clipPath={`url(#${ids.clip})`} />
        <path d={topPath} fill={`url(#${ids.soft})`} />
        <path d={topPath} fill={`url(#${ids.light})`} opacity="0.8" />
        <SignalGlassDefs ids={ids} clipPath={topPath} maskPath={topPath} />
      </svg>
    );
  },
);
SignalStyleIcon.displayName = "SignalStyleIcon";

export const SignalFormatIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) => {
    const ids = useSignalGlassIds("signal-format");
    const stackPath =
      "M9.27314 1.65692C11.4366 1.07722 12.5185 0.786577 13.4577 0.986024C14.284 1.16165 15.0341 1.59461 15.5993 2.22235C16.2419 2.93601 16.5312 4.01844 17.111 6.18231L17.9392 9.27313C18.2604 10.4721 18.489 11.3394 18.5983 12.0339C18.8581 12.2109 19.0893 12.3735 19.281 12.528C19.5983 12.784 19.9222 13.1009 20.1052 13.5417C20.3594 14.1547 20.3593 14.8446 20.1052 15.4577C19.9222 15.8988 19.5984 16.2153 19.281 16.4714C18.965 16.7261 18.544 17.0056 18.0593 17.3288L15.7858 18.8444C15.1963 19.2374 14.6967 19.5713 14.281 19.7966C13.8742 20.017 13.3904 20.2243 12.8503 20.1921C12.1209 20.1483 11.4464 19.7875 11.0056 19.2048C10.6988 18.7988 10.5976 18.3168 10.5515 17.8776L10.3229 17.9391C8.15946 18.5189 7.07759 18.8095 6.13837 18.61C5.31212 18.4344 4.562 18.0015 3.99677 17.3737C3.35423 16.6601 3.06485 15.5776 2.48505 13.4138L1.65693 10.3229C1.07723 8.15947 0.786567 7.07758 0.986031 6.13837C1.16166 5.31211 1.59461 4.56199 2.22236 3.99677C2.93601 3.35421 4.01847 3.06485 6.18232 2.48505L9.27314 1.65692Z";
    const topPath =
      "M16.0996 6.5C18.3398 6.5 19.4608 6.49957 20.3164 6.93555C21.0689 7.31902 21.681 7.93109 22.0645 8.68359C22.5004 9.53924 22.5 10.6602 22.5 12.9004V16.0996C22.5 18.3398 22.5004 19.4608 22.0645 20.3164C21.681 21.0689 21.0689 21.681 20.3164 22.0645C19.4608 22.5004 18.3398 22.5 16.0996 22.5H12.9004C10.6602 22.5 9.53924 22.5004 8.68359 22.0645C7.93109 21.681 7.31902 21.0689 6.93555 20.3164C6.49957 19.4608 6.5 18.3398 6.5 16.0996V12.9004C6.5 10.6602 6.49957 9.53924 6.93555 8.68359C7.31902 7.93109 7.93109 7.31902 8.68359 6.93555C9.53924 6.49957 10.6602 6.5 12.9004 6.5H16.0996ZM12.8691 10.1807C12.4405 10.2182 12.0485 10.438 11.793 10.7842C11.5001 11.1814 11.5 11.8808 11.5 13.2793V15.7207C11.5 17.1192 11.5001 17.8186 11.793 18.2158C12.0485 18.562 12.4405 18.7818 12.8691 18.8193C13.3608 18.8623 13.9578 18.498 15.1514 17.7686L17.1494 16.5479C18.257 15.871 18.8111 15.5324 19 15.0967C19.1649 14.7162 19.1649 14.2838 19 13.9033C18.8111 13.4676 18.257 13.129 17.1494 12.4521L15.1514 11.2314C13.9578 10.502 13.3608 10.1377 12.8691 10.1807Z";

    return (
      <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d={stackPath} fill={`url(#${ids.dark})`} mask={`url(#${ids.mask})`} />
        <path d={stackPath} fill={`url(#${ids.dark})`} filter={`url(#${ids.filter})`} clipPath={`url(#${ids.clip})`} />
        <path d={topPath} fill={`url(#${ids.soft})`} />
        <path d={topPath} fill={`url(#${ids.light})`} opacity="0.78" />
        <SignalGlassDefs ids={ids} clipPath={topPath} maskPath={topPath} />
      </svg>
    );
  },
);
SignalFormatIcon.displayName = "SignalFormatIcon";

export const SignalEraIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) => {
    const ids = useSignalGlassIds("signal-era");
    const basePath =
      "M6.47754 15.4951C7.58211 15.4951 8.47754 16.3905 8.47754 17.4951C8.47754 18.5997 7.58211 19.4951 6.47754 19.4951C5.37297 19.4951 4.47754 18.5997 4.47754 17.4951C4.47754 16.3905 5.37297 15.4951 6.47754 15.4951ZM12 15.4951C13.1046 15.4951 14 16.3905 14 17.4951C14 18.5997 13.1046 19.4951 12 19.4951C10.8954 19.4951 10 18.5997 10 17.4951C10 16.3905 10.8954 15.4951 12 15.4951ZM17.5234 15.4951C18.6278 15.4954 19.5234 16.3907 19.5234 17.4951C19.5234 18.5995 18.6278 19.4949 17.5234 19.4951C16.4189 19.4951 15.5234 18.5997 15.5234 17.4951C15.5234 16.3905 16.4189 15.4951 17.5234 15.4951ZM17 1C17.5523 1 18 1.44772 18 2V3.04004C18.7846 3.08782 19.3414 3.19353 19.8164 3.43555C20.5689 3.81902 21.181 4.43109 21.5645 5.18359C22.0004 6.03924 22 7.16018 22 9.40039V11H18.8428C19.259 11.3665 19.5234 11.9018 19.5234 12.5C19.5234 13.6044 18.6278 14.4997 17.5234 14.5C16.4189 14.5 15.5234 13.6046 15.5234 12.5C15.5234 11.9018 15.7869 11.3665 16.2031 11H13.3193C13.7357 11.3665 14 11.9017 14 12.5C14 13.6046 13.1046 14.5 12 14.5C10.8954 14.5 10 13.6046 10 12.5C10 11.9017 10.2643 11.3665 10.6807 11H7.79688C8.21325 11.3665 8.47754 11.9017 8.47754 12.5C8.47754 13.6046 7.58211 14.5 6.47754 14.5C5.37297 14.5 4.47754 13.6046 4.47754 12.5C4.47754 11.9017 4.74183 11.3665 5.1582 11H2V9.40039C2 7.16018 1.99957 6.03924 2.43555 5.18359C2.81902 4.43109 3.43109 3.81902 4.18359 3.43555C4.65858 3.19353 5.21543 3.08782 6 3.04004V2C6 1.44772 6.44772 1 7 1C7.55228 1 8 1.44772 8 2V3.00098C8.12937 3.00088 8.26277 3 8.40039 3H11V2C11 1.44772 11.4477 1 12 1C12.5523 1 13 1.44772 13 2V3H15.5996C15.7372 3 15.8706 3.00088 16 3.00098V2C16 1.44772 16.4477 1 17 1Z";
    const topPath =
      "M15.5996 7C17.8398 7 18.9608 6.99957 19.8164 7.43555C20.5689 7.81902 21.181 8.43109 21.5645 9.18359C22.0004 10.0392 22 11.1602 22 13.4004V15.5996C22 17.8398 22.0004 18.9608 21.5645 19.8164C21.181 20.5689 20.5689 21.181 19.8164 21.5645C18.9608 22.0004 17.8398 22 15.5996 22H8.40039C6.16018 22 5.03924 22.0004 4.18359 21.5645C3.43109 21.181 2.81902 20.5689 2.43555 19.8164C1.99957 18.9608 2 17.8398 2 15.5996V13.4004C2 11.1602 1.99957 10.0392 2.43555 9.18359C2.81902 8.43109 3.43109 7.81902 4.18359 7.43555C5.03924 6.99957 6.16018 7 8.40039 7H15.5996ZM6.5 16C5.67157 16 5 16.6716 5 17.5C5 18.3284 5.67157 19 6.5 19C7.32843 19 8 18.3284 8 17.5C8 16.6716 7.32843 16 6.5 16ZM12 16C11.1716 16 10.5 16.6716 10.5 17.5C10.5 18.3284 11.1716 19 12 19C12.8284 19 13.5 18.3284 13.5 17.5C13.5 16.6716 12.8284 16 12 16ZM17.5 16C16.6716 16 16 16.6716 16 17.5C16 18.3284 16.6716 19 17.5 19C18.3284 19 19 18.3284 19 17.5C19 16.6716 18.3284 16 17.5 16ZM6.5 11C5.67157 11 5 11.6716 5 12.5C5 13.3284 5.67157 14 6.5 14C7.32843 14 8 13.3284 8 12.5C8 11.6716 7.32843 11 6.5 11ZM12 11C11.1716 11 10.5 11.6716 10.5 12.5C10.5 13.3284 11.1716 14 12 14C12.8284 14 13.5 13.3284 13.5 12.5C13.5 11.6716 12.8284 11 12 11ZM17.5 11C16.6716 11 16 11.6716 16 12.5C16 13.3284 16.6716 14 17.5 14C18.3284 14 19 13.3284 19 12.5C19 11.6716 18.3284 11 17.5 11Z";

    return (
      <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d={basePath} fill={`url(#${ids.dark})`} mask={`url(#${ids.mask})`} />
        <path d={basePath} fill={`url(#${ids.dark})`} filter={`url(#${ids.filter})`} clipPath={`url(#${ids.clip})`} />
        <path d={topPath} fill={`url(#${ids.soft})`} />
        <path d={topPath} fill={`url(#${ids.light})`} opacity="0.76" />
        <SignalGlassDefs ids={ids} clipPath={topPath} maskPath={topPath} />
      </svg>
    );
  },
);
SignalEraIcon.displayName = "SignalEraIcon";

export const ComposeChevronLeftIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ strokeWidth = 1.5, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M13.5858 16L10.2929 12.7071C9.90237 12.3166 9.90237 11.6834 10.2929 11.2929L13.5858 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  ),
);
ComposeChevronLeftIcon.displayName = "ComposeChevronLeftIcon";

export const ComposeDesktopChevronLeftIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ strokeWidth = 1.5, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14.5 18.25L8.25 12L14.5 5.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  ),
);
ComposeDesktopChevronLeftIcon.displayName = "ComposeDesktopChevronLeftIcon";

export const ComposeChevronRightIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ strokeWidth = 1.5, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 16L13.2929 12.7071C13.6834 12.3166 13.6834 11.6834 13.2929 11.2929L10 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  ),
);
ComposeChevronRightIcon.displayName = "ComposeChevronRightIcon";

export const StarterCurateIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ strokeWidth = 1.5, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16.25 20.25V16.9612C16.25 16.3537 16.5262 15.7791 17.0006 15.3995L20.5759 12.5393C20.9936 12.2051 21.2036 11.675 21.1279 11.1454C20.9617 9.9818 19.5624 9.41069 18.5693 10.0394C16.7891 11.1665 14.215 12.5 12 12.5C9.78501 12.5 7.21086 11.1665 5.43068 10.0394C4.43759 9.41069 3.03831 9.9818 2.87209 11.1454C2.79643 11.675 3.00638 12.2051 3.42412 12.5393L6.99939 15.3995C7.47382 15.7791 7.75 16.3537 7.75 16.9612V20.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <circle cx="12" cy="6.5" r="2.75" stroke="currentColor" strokeWidth={strokeWidth} />
      <path
        d="M19.5 9.5L20.75 2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.25}
      />
    </svg>
  ),
);
StarterCurateIcon.displayName = "StarterCurateIcon";

export const StarterFilterIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ strokeWidth = 1.5, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.75 4.75H21.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M8.75 19.25H15.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M5.75 12H18.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  ),
);
StarterFilterIcon.displayName = "StarterFilterIcon";

export const Archive = createIcon(ArchiveIcon, "Archive");
export const ArrowLeft = createIcon(ArrowLeft01Icon, "ArrowLeft");
export const ArrowLeftIcon = ArrowLeft;
export const ArrowRight = createIcon(ArrowRight01Icon, "ArrowRight");
export const ArrowRightIcon = ArrowRight;
export const Bell = createIcon(Notification01Icon, "Bell");
export const BellSimpleIcon = Bell;
export const Bookmark = createIcon(Bookmark02Icon, "Bookmark");
export const BookmarkSimpleIcon = Bookmark;
export const CameraIcon = createIcon(Camera01Icon, "CameraIcon");
export const CaretLeftIcon = createIcon(ArrowLeft01Icon, "CaretLeftIcon");
export const CaretRightIcon = createIcon(ArrowRight01Icon, "CaretRightIcon");
export const ChatCircleTextIcon = createIcon(ChatIcon, "ChatCircleTextIcon");
export const Check = createIcon(Tick02Icon, "Check");
export const CheckIcon = Check;
export const ChevronLeft = createIcon(ArrowLeft01Icon, "ChevronLeft");
export const ChevronRight = createIcon(ArrowRight01Icon, "ChevronRight");
export const CircleUserRoundIcon = createIcon(HugeUserCircleIcon, "CircleUserRoundIcon");
export const Copy = createIcon(Copy01Icon, "Copy");
export const CornerUpRight = createIcon(ArrowTurnForwardIcon, "CornerUpRight");
export const Disc3 = createIcon(DiscThreeIcon, "Disc3");
export const DotsThreeIcon = createIcon(MoreHorizontalIcon, "DotsThreeIcon");
export const ExternalLink = createIcon(ArrowUpRight01Icon, "ExternalLink");
export const Flag = createIcon(Flag01Icon, "Flag");
export const GearSixIcon = createIcon(Settings02Icon, "GearSixIcon");
export const Heart = createIcon(FavouriteIcon, "Heart");
export const HeartIcon = Heart;
export const HouseIcon = createIcon(Home01Icon, "HouseIcon");
export const IconAlertOctagon = createIcon(OctagonXIcon, "IconAlertOctagon");
export const IconAlertTriangle = createIcon(TriangleIcon, "IconAlertTriangle");
export const IconCheck = Check;
export const IconChevronDown = createIcon(ArrowDown01Icon, "IconChevronDown");
export const IconChevronLeft = ChevronLeft;
export const IconChevronRight = ChevronRight;
export const IconChevronUp = createIcon(ArrowUp01Icon, "IconChevronUp");
export const IconCircleCheck = createIcon(CheckmarkCircle01Icon, "IconCircleCheck");
export const IconDots = createIcon(MoreHorizontalIcon, "IconDots");
export const IconInfoCircle = createIcon(InformationCircleIcon, "IconInfoCircle");
export const IconLoader = createIcon(Loading03Icon, "IconLoader");
export const IconMinus = createIcon(MinusSignIcon, "IconMinus");
export const IconSearch = createIcon(Search01Icon, "IconSearch");
export const IconSelector = createIcon(UnfoldMoreIcon, "IconSelector");
export const IconX = createIcon(Cancel01Icon, "IconX");
export const LinkIcon = createIcon(Link04Icon, "LinkIcon");
export const List = createIcon(Menu01Icon, "List");
export const LoaderCircle = createIcon(Loading03Icon, "LoaderCircle");
export const MagnifyingGlassIcon = createIcon(Search01Icon, "MagnifyingGlassIcon");
export const MessageCircle = createIcon(Message01Icon, "MessageCircle");
export const MessageSquarePlus = createIcon(MessageAdd01Icon, "MessageSquarePlus");
export const MoreHorizontal = createIcon(MoreHorizontalIcon, "MoreHorizontal");
export const Music2 = createIcon(MusicNote03Icon, "Music2");
export const Pencil = createIcon(PencilIcon, "Pencil");
export const PencilLine = createIcon(PencilEdit01Icon, "PencilLine");
export const Plus = createIcon(PlusSignIcon, "Plus");
export const PushPinSimpleIcon = createIcon(PinIcon, "PushPinSimpleIcon");
export const Search = createIcon(Search01Icon, "Search");
export const Send = createIcon(SentIcon, "Send");
export const Share2 = createIcon(Share08Icon, "Share2");
export const SidebarSimpleIcon = createIcon(SidebarLeftIcon, "SidebarSimpleIcon");
export const SignOutIcon = createIcon(Logout03Icon, "SignOutIcon");
export const SparkleIcon = createIcon(SparklesIcon, "SparkleIcon");
export const Sparkles = SparkleIcon;
export const SpinnerGapIcon = LoaderCircle;
export const Star = createIcon(HugeStarIcon, "Star");
export const StarIcon = Star;
export const Tags = createIcon(TagsIcon, "Tags");
export const TextQuote = createIcon(QuoteUpIcon, "TextQuote");
export const Trash2 = createIcon(Delete02Icon, "Trash2");
export const UserCheck = createIcon(UserCheck01Icon, "UserCheck");
export const UserCircleIcon = createIcon(HugeUserCircleIcon, "UserCircleIcon");
export const UserPlus = createIcon(UserAdd01Icon, "UserPlus");
export const UsersRound = createIcon(UserGroupIcon, "UsersRound");
export const VinylRecordIcon = createIcon(RecordIcon, "VinylRecordIcon");
export const WarningCircleIcon = createIcon(AlertCircleIcon, "WarningCircleIcon");
export const X = createIcon(Cancel01Icon, "X");
export const XIcon = X;
