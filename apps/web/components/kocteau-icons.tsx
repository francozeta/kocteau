import { forwardRef, type SVGProps } from "react";
import { cn } from "@/lib/utils";

type KocteauIconWeight =
  | "thin"
  | "light"
  | "regular"
  | "bold"
  | "fill"
  | "duotone";

type KocteauIconProps = SVGProps<SVGSVGElement> & {
  absoluteStrokeWidth?: boolean;
  size?: string | number;
  weight?: KocteauIconWeight;
};

function strokeWidthForWeight(weight?: KocteauIconWeight, strokeWidth?: string | number) {
  if (typeof strokeWidth === "number") return strokeWidth;
  if (typeof strokeWidth === "string") return strokeWidth;
  if (weight === "thin") return 1.15;
  if (weight === "light") return 1.3;
  if (weight === "bold" || weight === "fill") return 1.7;
  return 1.5;
}

function splitIconProps({ absoluteStrokeWidth, size, ...props }: KocteauIconProps) {
  void absoluteStrokeWidth;
  void size;
  return props;
}

export const ReviewGlyphIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);
    const isFilled = weight === "fill";

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("icon size-5 shrink-0", className)}
        fill="none"
        {...props}
      >
        <path
          d={isFilled
            ? "M20.25 3C20.5123 3 20.7557 3.13698 20.8916 3.36133C21.0274 3.58583 21.0358 3.8652 20.9141 4.09766C20.2252 5.4127 19.4819 6.80261 18.4443 7.84961C17.6232 8.67815 16.6209 9.28896 15.3389 9.53125C15.6105 10.1442 15.7295 10.7773 15.707 11.4072C15.6711 12.4153 15.2759 13.3615 14.6631 14.1621C13.4458 15.7523 11.3085 16.8525 9 16.8525C7.81524 16.8525 6.66544 17.0636 5.83594 17.584C5.059 18.0715 4.5 18.8656 4.5 20.25C4.5 20.6642 4.16421 21 3.75 21C3.33579 21 3 20.6642 3 20.25V16.1025C3.00022 8.86409 8.88554 3.00014 16.1406 3H20.25Z"
            : "M3.75 16.1029V20.25C3.75 16.9746 6.5 16.1029 9 16.1029C13.1643 16.1029 16.6578 12.1147 14.0757 8.89706C17.4661 8.89706 18.856 6.41115 20.25 3.75H16.1409C9.29758 3.75 3.75 9.2806 3.75 16.1029Z"}
          fill={isFilled ? "currentColor" : "none"}
          stroke={isFilled ? "none" : "currentColor"}
          strokeWidth={isFilled ? undefined : strokeWidthForWeight(weight, strokeWidth)}
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
ReviewGlyphIcon.displayName = "ReviewGlyphIcon";

export const KocteauSearchIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("icon size-5 shrink-0", className)}
        fill="none"
        {...props}
      >
        <path
          d="M20.25 20.25L16.1265 16.1265M16.1265 16.1265C17.4385 14.8145 18.25 13.002 18.25 11C18.25 6.99594 15.0041 3.75 11 3.75C6.99594 3.75 3.75 6.99594 3.75 11C3.75 15.0041 6.99594 18.25 11 18.25C13.002 18.25 14.8145 17.4385 16.1265 16.1265Z"
          stroke="currentColor"
          strokeWidth={strokeWidthForWeight(weight, strokeWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauSearchIcon.displayName = "KocteauSearchIcon";

export const KocteauHomeIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, weight, ...props } = splitIconProps(iconProps);
    const isActive = weight === "fill";

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("icon size-5 shrink-0", className)}
        fill="none"
        {...props}
      >
        <path
          d={
            isActive
              ? "M13.8153 2.34689C12.7771 1.4345 11.2229 1.4345 10.1847 2.34689L3.93468 7.83932C3.34056 8.36143 3 9.11408 3 9.90502V18.2501C3 19.7689 4.23122 21.0001 5.75 21.0001H8.16057C9.12707 21.0001 9.91057 20.2166 9.91057 19.2501V17.0001C9.91057 15.8955 10.806 15.0001 11.9106 15.0001H12C13.1046 15.0001 14 15.8955 14 17.0001V19.2501C14 20.2166 14.7835 21.0001 15.75 21.0001H18.25C19.7688 21.0001 21 19.7689 21 18.2501V9.90502C21 9.11408 20.6594 8.36143 20.0653 7.83932L13.8153 2.34689Z"
              : "M19.5 9.90496V18.25H21V9.90496H19.5ZM4.5 18.25V9.90496H3V18.25H4.5ZM4.92486 8.966L11.1749 3.47358L10.1847 2.34683L3.93468 7.83925L4.92486 8.966ZM12.8251 3.47358L19.0751 8.966L20.0653 7.83925L13.8153 2.34683L12.8251 3.47358ZM11.75 15.5H12.25V14H11.75V15.5ZM13.5 16.75V19.25H15V16.75H13.5ZM10.5 19.25V16.75H9V19.25H10.5ZM8.75 19.5H5.75V21H8.75V19.5ZM15.25 21H18.25V19.5H15.25V21ZM9 19.25C9 19.3881 8.88807 19.5 8.75 19.5V21C9.7165 21 10.5 20.2165 10.5 19.25H9ZM13.5 19.25C13.5 20.2165 14.2835 21 15.25 21V19.5C15.1119 19.5 15 19.3881 15 19.25H13.5ZM12.25 15.5C12.9404 15.5 13.5 16.0596 13.5 16.75H15C15 15.2312 13.7688 14 12.25 14V15.5ZM11.75 14C10.2312 14 9 15.2312 9 16.75H10.5C10.5 16.0596 11.0596 15.5 11.75 15.5V14ZM11.1749 3.47358C11.6468 3.05885 12.3532 3.05885 12.8251 3.47358L13.8153 2.34683C12.7771 1.43443 11.2229 1.43443 10.1847 2.34683L11.1749 3.47358ZM3 18.25C3 19.7688 4.23122 21 5.75 21V19.5C5.05964 19.5 4.5 18.9404 4.5 18.25H3ZM19.5 18.25C19.5 18.9404 18.9404 19.5 18.25 19.5V21C19.7688 21 21 19.7688 21 18.25H19.5ZM21 9.90496C21 9.11401 20.6594 8.36136 20.0653 7.83925L19.0751 8.966C19.3452 9.20332 19.5 9.54544 19.5 9.90496H21ZM4.5 9.90496C4.5 9.54544 4.6548 9.20332 4.92486 8.966L3.93468 7.83925C3.34056 8.36136 3 9.11401 3 9.90496H4.5Z"
          }
          fill="currentColor"
        />
      </svg>
    );
  },
);
KocteauHomeIcon.displayName = "KocteauHomeIcon";

export const KocteauLibraryIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("icon size-5 shrink-0", className)}
        fill="none"
        {...props}
      >
        <path
          d="M8.75 6.75H15.25"
          stroke="currentColor"
          strokeWidth={strokeWidthForWeight(weight, strokeWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.25 16V3.75C19.25 3.19772 18.8023 2.75 18.25 2.75H7.75C6.09315 2.75 4.75 4.09315 4.75 5.75V19.75"
          stroke="currentColor"
          strokeWidth={strokeWidthForWeight(weight, strokeWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.25 15.25H6.25C5.42157 15.25 4.75 15.9216 4.75 16.75C4.75 17.5784 5.42157 18.25 6.25 18.25H19.25V15.25Z"
          stroke="currentColor"
          strokeWidth={strokeWidthForWeight(weight, strokeWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.25 18.25H6.25C5.42157 18.25 4.75 18.9216 4.75 19.75C4.75 20.5784 5.42157 21.25 6.25 21.25H19.25V18.25Z"
          stroke="currentColor"
          strokeWidth={strokeWidthForWeight(weight, strokeWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauLibraryIcon.displayName = "KocteauLibraryIcon";

export const KocteauStarterIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);
    const resolvedStrokeWidth = strokeWidthForWeight(weight, strokeWidth);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("icon size-5 shrink-0", className)}
        fill="none"
        {...props}
      >
        <path
          d="M12 21.25C16.8325 21.25 20.75 17.3325 20.75 12.5C20.75 11.6044 20.6154 10.7401 20.3654 9.92647H4M12 3.75C7.16751 3.75 3.25 7.66751 3.25 12.5C3.25 13.3956 3.38457 14.2599 3.63459 15.0735H20"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse
          cx="12"
          cy="12.5"
          rx="3.25"
          ry="8.75"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 3.5V1.75"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.89045 18.5352L5.40769 17.28C5.34281 17.1113 5.18074 17 5 17C4.81926 17 4.65719 17.1113 4.59231 17.28L4.10955 18.5352C4.00797 18.7993 3.79927 19.008 3.53518 19.1095L2.28 19.5923C2.11131 19.6572 2 19.8193 2 20C2 20.1807 2.11131 20.3428 2.28 20.4077L3.53518 20.8905C3.79927 20.992 4.00797 21.2007 4.10955 21.4648L4.59231 22.72C4.65719 22.8887 4.81926 23 5 23C5.18074 23 5.34281 22.8887 5.40769 22.72L5.89045 21.4648C5.99203 21.2007 6.20073 20.992 6.46482 20.8905L7.72 20.4077C7.88869 20.3428 8 20.1807 8 20C8 19.8193 7.88869 19.6572 7.72 19.5923L6.46482 19.1095C6.20073 19.008 5.99203 18.7993 5.89045 18.5352Z"
          fill="currentColor"
        />
        <path
          d="M20.5655 2.86018L19.9756 1.32667C19.8999 1.12986 19.7109 1 19.5 1C19.2891 1 19.1001 1.12986 19.0244 1.32667L18.4345 2.86018C18.333 3.12427 18.1243 3.33297 17.8602 3.43455L16.3267 4.02436C16.1299 4.10005 16 4.28914 16 4.5C16 4.71086 16.1299 4.89995 16.3267 4.97564L17.8602 5.56545C18.1243 5.66703 18.333 5.87573 18.4345 6.13982L19.0244 7.67333C19.1001 7.87014 19.2891 8 19.5 8C19.7109 8 19.8999 7.87014 19.9756 7.67333L20.5655 6.13982C20.667 5.87573 20.8757 5.66703 21.1398 5.56545L22.6733 4.97564C22.8701 4.89995 23 4.71086 23 4.5C23 4.28914 22.8701 4.10005 22.6733 4.02436L21.1398 3.43455C20.8757 3.33297 20.667 3.12427 20.5655 2.86018Z"
          fill="currentColor"
        />
      </svg>
    );
  },
);
KocteauStarterIcon.displayName = "KocteauStarterIcon";

export const KocteauHealthIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);
    const resolvedStrokeWidth = strokeWidthForWeight(weight, strokeWidth);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("icon size-5 shrink-0", className)}
        fill="none"
        {...props}
      >
        <path
          d="M14.25 21.25V19.1667C14.25 18.6144 14.6977 18.1667 15.25 18.1667H16.25C17.3546 18.1667 18.25 17.2712 18.25 16.1667V14.1506C18.25 13.7766 18.4587 13.4338 18.791 13.2622L19.7558 12.7637C20.2859 12.4898 20.4584 11.8164 20.126 11.3209C19.1865 9.92 18.3584 8.63502 17.7163 6.99759C16.6018 4.15584 13.8984 2.75 10.9621 2.75C6.97898 2.75 3.75 5.97106 3.75 9.94444C3.75 11.6184 4.3231 13.1588 5.28425 14.3811C6.97969 16.5372 6.75 18.6556 6.75 21.25"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinecap="square"
          strokeLinejoin="round"
        />
        <path
          d="M10 2.25V6.25M10 12.75C8.75736 12.75 7.75 11.7426 7.75 10.5V8.75C7.75 7.50736 8.75736 6.5 10 6.5C11.2426 6.5 12.25 7.50736 12.25 8.75V10.5C12.25 11.7426 11.2426 12.75 10 12.75Z"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinecap="round"
        />
      </svg>
    );
  },
);
KocteauHealthIcon.displayName = "KocteauHealthIcon";

export const KocteauProfileIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);
    const resolvedStrokeWidth = strokeWidthForWeight(weight, strokeWidth);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("icon size-5 shrink-0", className)}
        fill="none"
        {...props}
      >
        <path
          d="M6.5 20.25C5.39543 20.25 4.47594 19.3452 4.69524 18.2626C5.37179 14.9227 7.80671 12.25 12 12.25C16.1924 12.25 18.4514 14.9215 19.0718 18.2605C19.2736 19.3464 18.3546 20.25 17.25 20.25H6.5Z"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="7.75"
          r="4.5"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauProfileIcon.displayName = "KocteauProfileIcon";

export const KocteauLogoutIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);
    const resolvedStrokeWidth = strokeWidthForWeight(weight, strokeWidth);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("icon size-5 shrink-0", className)}
        fill="none"
        {...props}
      >
        <path
          d="M20.25 12L9 12M20.25 12L15.75 16.5M20.25 12L15.75 7.5M11.25 20.25H5.75C4.64543 20.25 3.75 19.3546 3.75 18.25L3.75 5.75C3.75 4.64543 4.64543 3.75 5.75 3.75L11.25 3.75"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauLogoutIcon.displayName = "KocteauLogoutIcon";

export const KocteauEditProfileIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);
    const resolvedStrokeWidth = strokeWidthForWeight(weight, strokeWidth);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("icon size-5 shrink-0", className)}
        fill="none"
        {...props}
      >
        <circle
          cx="12"
          cy="7.75"
          r="4.5"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.0014 12.25C7.80812 12.25 5.3732 14.9227 4.69664 18.2626C4.47735 19.3452 5.39684 20.25 6.50141 20.25H10.2515"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.75 20.25V18.4118C13.75 17.8813 13.9607 17.3726 14.3358 16.9975L17.75 13.5833C18.4864 12.847 19.6803 12.847 20.4167 13.5833C21.153 14.3197 21.153 15.5136 20.4167 16.25L17.0025 19.6642C16.6274 20.0393 16.1187 20.25 15.5882 20.25H13.75Z"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauEditProfileIcon.displayName = "KocteauEditProfileIcon";

export const KocteauActivityIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);
    const resolvedStrokeWidth = strokeWidthForWeight(weight, strokeWidth);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("icon size-5 shrink-0", className)}
        fill="none"
        {...props}
      >
        <path
          d="M20.25 16.2441C20.25 16.7996 19.7996 17.25 19.2441 17.25H4.75593C4.20037 17.25 3.75 16.7996 3.75 16.2441C3.75 16.0837 3.78835 15.9256 3.86186 15.7831L5.09883 13.3841C5.22935 13.131 5.30431 12.8529 5.31867 12.5684L5.50351 8.90897C5.6766 5.45882 8.53386 2.75 12 2.75C15.4661 2.75 18.3234 5.45882 18.4965 8.90897L18.6813 12.5684C18.6957 12.8529 18.7706 13.131 18.9012 13.3841L20.1381 15.7831C20.2116 15.9256 20.25 16.0837 20.25 16.2441Z"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 17.25C16 19.4591 14.2091 21.25 12 21.25C9.79086 21.25 8 19.4591 8 17.25"
          stroke="currentColor"
          strokeWidth={resolvedStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauActivityIcon.displayName = "KocteauActivityIcon";
