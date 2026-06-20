import {
  forwardRef,
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
