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
    void strokeWidth;
    void weight;

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
          d="M3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11C19 12.9388 18.3096 14.7174 17.1624 16.1018L20.5303 19.4697C20.8232 19.7626 20.8232 20.2374 20.5303 20.5303C20.2374 20.8232 19.7625 20.8232 19.4696 20.5303L16.1017 17.1624C14.7174 18.3096 12.9388 19 11 19C6.58172 19 3 15.4183 3 11Z"
          fill="currentColor"
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
    void strokeWidth;
    void weight;

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
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.2324 8.35396C13.966 7.4249 14.5031 6.45579 15.4322 6.18939L16.8741 5.77593C17.8032 5.50953 18.7723 6.04672 19.0387 6.97577L22.2085 18.0303C22.4749 18.9593 21.9377 19.9285 21.0087 20.1949L19.5668 20.6083C18.6377 20.8747 17.6686 20.3375 17.4022 19.4085L14.2324 8.35396Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.75 3C7.7835 3 7 3.7835 7 4.75V19.25C7 20.2165 7.7835 21 8.75 21H12.25C13.2165 21 14 20.2165 14 19.25V4.75C14 3.7835 13.2165 3 12.25 3H8.75ZM8.5 7.75C8.5 7.33579 8.83579 7 9.25 7H11.75C12.1642 7 12.5 7.33579 12.5 7.75C12.5 8.16421 12.1642 8.5 11.75 8.5H9.25C8.83579 8.5 8.5 8.16421 8.5 7.75ZM12.5 16.25C12.5 15.8358 12.1642 15.5 11.75 15.5H9.25C8.83579 15.5 8.5 15.8358 8.5 16.25C8.5 16.6642 8.83579 17 9.25 17H11.75C12.1642 17 12.5 16.6642 12.5 16.25Z"
          fill="currentColor"
        />
        <path
          d="M3.75 5C2.7835 5 2 5.7835 2 6.75V19.25C2 20.2165 2.7835 21 3.75 21H4.25C5.2165 21 6 20.2165 6 19.25V6.75C6 5.7835 5.2165 5 4.25 5H3.75Z"
          fill="currentColor"
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

export const KocteauReviewsIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
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
          d="M11.3151 2.17969C11.5904 1.60677 12.4096 1.60677 12.6849 2.17969L15.0534 7.10966C15.1643 7.34032 15.3847 7.49956 15.6393 7.5329L21.0889 8.24637C21.7226 8.32933 21.976 9.1071 21.5119 9.54462L17.5278 13.3009C17.3409 13.4772 17.2564 13.7357 17.3034 13.9877L18.3039 19.3544C18.4204 19.9793 17.7574 20.4596 17.1961 20.157L12.3614 17.5509C12.1359 17.4294 11.8641 17.4294 11.6386 17.5509L6.80393 20.157C6.24257 20.4596 5.57955 19.9793 5.69605 19.3544L6.69661 13.9877C6.7436 13.7357 6.65911 13.4772 6.47218 13.3009L2.48806 9.54462C2.024 9.1071 2.27743 8.32933 2.91107 8.24637L8.36069 7.5329C8.61531 7.49956 8.83574 7.34032 8.94656 7.10966L11.3151 2.17969Z"
          fill={isFilled ? "currentColor" : "none"}
          stroke={isFilled ? "none" : "currentColor"}
          strokeWidth={isFilled ? undefined : strokeWidthForWeight(weight, strokeWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauReviewsIcon.displayName = "KocteauReviewsIcon";

export const KocteauChevronLeftSmallIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);

    return (
      <svg ref={ref} viewBox="0 0 24 24" aria-hidden="true" className={cn("icon size-5 shrink-0", className)} fill="none" {...props}>
        <path
          d="M13.5858 16L10.2929 12.7071C9.90237 12.3166 9.90237 11.6834 10.2929 11.2929L13.5858 8"
          stroke="currentColor"
          strokeWidth={strokeWidthForWeight(weight, strokeWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauChevronLeftSmallIcon.displayName = "KocteauChevronLeftSmallIcon";

export const KocteauChevronLeftMediumIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);

    return (
      <svg ref={ref} viewBox="0 0 24 24" aria-hidden="true" className={cn("icon size-5 shrink-0", className)} fill="none" {...props}>
        <path
          d="M14.5 18.25L8.25 12L14.5 5.75"
          stroke="currentColor"
          strokeWidth={strokeWidthForWeight(weight, strokeWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauChevronLeftMediumIcon.displayName = "KocteauChevronLeftMediumIcon";

export const KocteauMoreIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, ...props } = splitIconProps(iconProps);

    return (
      <svg ref={ref} viewBox="0 0 24 24" aria-hidden="true" className={cn("icon size-5 shrink-0", className)} fill="none" {...props}>
        <rect x="3" y="10" width="4" height="4" rx="2" fill="currentColor" />
        <rect x="10" y="10" width="4" height="4" rx="2" fill="currentColor" />
        <rect x="17" y="10" width="4" height="4" rx="2" fill="currentColor" />
      </svg>
    );
  },
);
KocteauMoreIcon.displayName = "KocteauMoreIcon";

export const KocteauLikeIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);
    const isFilled = weight === "fill";

    return (
      <svg ref={ref} viewBox="0 0 24 24" aria-hidden="true" className={cn("icon size-5 shrink-0", className)} fill="none" {...props}>
        <path
          d={isFilled
            ? "M12.367 21.404C21.0867 16.5047 23.0858 10.7671 21.517 6.84578C20.7498 4.92821 19.1421 3.55922 17.2522 3.1368C15.5338 2.75271 13.6394 3.16312 11.9995 4.54956C10.3596 3.16312 8.46525 2.75271 6.74682 3.13681C4.85695 3.55922 3.24924 4.92822 2.48209 6.8458C0.913293 10.7672 2.91243 16.5047 11.6322 21.404C11.8603 21.5322 12.1388 21.5322 12.367 21.404Z"
            : "M12 5.57193C18.3331 -0.86765 29.1898 11.0916 12 20.75C-5.18982 11.0916 5.66687 -0.867651 12 5.57193Z"}
          fill={isFilled ? "currentColor" : "none"}
          stroke={isFilled ? "none" : "currentColor"}
          strokeWidth={isFilled ? undefined : strokeWidthForWeight(weight, strokeWidth)}
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauLikeIcon.displayName = "KocteauLikeIcon";

export const KocteauCommentIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);

    return (
      <svg ref={ref} viewBox="0 0 24 24" aria-hidden="true" className={cn("icon size-5 shrink-0", className)} fill="none" {...props}>
        <path
          d="M15.25 9H8.75M15.25 13H8.75M9.29422 18.4836L11.3593 20.2147C11.7292 20.5248 12.2679 20.5263 12.6397 20.2183L14.738 18.4799C14.9173 18.3313 15.143 18.25 15.3759 18.25H18.25C19.3546 18.25 20.25 17.3546 20.25 16.25V5.75C20.25 4.64543 19.3546 3.75 18.25 3.75H5.75C4.64543 3.75 3.75 4.64543 3.75 5.75V16.25C3.75 17.3546 4.64543 18.25 5.75 18.25H8.65182C8.88675 18.25 9.11418 18.3327 9.29422 18.4836Z"
          stroke="currentColor"
          strokeWidth={strokeWidthForWeight(weight, strokeWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauCommentIcon.displayName = "KocteauCommentIcon";

export const KocteauBookmarkIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, strokeWidth, weight, ...props } = splitIconProps(iconProps);
    const isFilled = weight === "fill";

    return (
      <svg ref={ref} viewBox="0 0 24 24" aria-hidden="true" className={cn("icon size-5 shrink-0", className)} fill="none" {...props}>
        <path
          d={isFilled
            ? "M6.75 2C5.23122 2 4 3.23122 4 4.75V20.2515C4 21.6527 5.56475 22.4857 6.72719 21.7032L11.302 18.6239C11.724 18.3399 12.276 18.3399 12.698 18.6239L17.2728 21.7032C18.4353 22.4857 20 21.6527 20 20.2515V4.75C20 3.23122 18.7688 2 17.25 2H6.75Z"
            : "M19.25 20.2515V4.75C19.25 3.64543 18.3546 2.75 17.25 2.75H6.75C5.64543 2.75 4.75 3.64543 4.75 4.75V20.2515C4.75 21.0522 5.64414 21.5281 6.30839 21.081L10.8832 18.0017C11.5584 17.5473 12.4416 17.5473 13.1168 18.0017L17.6916 21.081C18.3559 21.5282 19.25 21.0522 19.25 20.2515Z"}
          fill={isFilled ? "currentColor" : "none"}
          stroke={isFilled ? "none" : "currentColor"}
          strokeWidth={isFilled ? undefined : strokeWidthForWeight(weight, strokeWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);
KocteauBookmarkIcon.displayName = "KocteauBookmarkIcon";

export const KocteauArtistIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, ...props } = splitIconProps(iconProps);

    return (
      <svg ref={ref} viewBox="0 0 24 24" aria-hidden="true" className={cn("icon size-5 shrink-0", className)} fill="none" {...props}>
        <path d="M14.7509 13.25L6.41008 20.6494C5.61848 21.3517 4.41712 21.3157 3.66886 20.5674L3.43351 20.332C2.68526 19.5838 2.64923 18.3824 3.35148 17.5908L10.7509 9.25L14.7509 13.25Z" fill="currentColor" />
        <path d="M16.5009 2.5C19.2623 2.50006 21.5009 4.73861 21.5009 7.5C21.5009 10.2614 19.2623 12.4999 16.5009 12.5C16.3014 12.5 16.1045 12.4885 15.9111 12.4658L11.5351 8.08984C11.5123 7.8964 11.5009 7.69956 11.5009 7.5C11.5009 4.73858 13.7395 2.5 16.5009 2.5Z" fill="currentColor" />
      </svg>
    );
  },
);
KocteauArtistIcon.displayName = "KocteauArtistIcon";

export const KocteauAlbumIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, ...props } = splitIconProps(iconProps);

    return (
      <svg ref={ref} viewBox="0 0 24 24" aria-hidden="true" className={cn("icon size-5 shrink-0", className)} fill="none" {...props}>
        <path fillRule="evenodd" clipRule="evenodd" d="M11 5.78887C11 4.00963 12.664 2.69875 14.3938 3.1153L18.8938 4.19894C20.1293 4.49645 21 5.60173 21 6.87251V17.1277C21 18.3984 20.1293 19.5037 18.8938 19.8012L14.3938 20.8849C12.664 21.3014 11 19.9905 11 18.2113V5.78887ZM7.75 4.00008C8.16421 4.00008 8.5 4.33587 8.5 4.75008V19.2501C8.5 19.6643 8.16421 20.0001 7.75 20.0001C7.33579 20.0001 7 19.6643 7 19.2501V4.75008C7 4.33587 7.33579 4.00008 7.75 4.00008ZM3.75 5.00008C4.16421 5.00008 4.5 5.33587 4.5 5.75008V18.2501C4.5 18.6643 4.16421 19.0001 3.75 19.0001C3.33579 19.0001 3 18.6643 3 18.2501V5.75008C3 5.33587 3.33579 5.00008 3.75 5.00008Z" fill="currentColor" />
      </svg>
    );
  },
);
KocteauAlbumIcon.displayName = "KocteauAlbumIcon";

export const KocteauSongIcon = forwardRef<SVGSVGElement, KocteauIconProps>(
  (iconProps, ref) => {
    const { className, ...props } = splitIconProps(iconProps);

    return (
      <svg ref={ref} viewBox="0 0 24 24" aria-hidden="true" className={cn("icon size-5 shrink-0", className)} fill="none" {...props}>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM17.96 13.0303C17.5638 12.9099 17.145 13.1332 17.0244 13.5293C16.5175 15.1971 15.2005 16.5153 13.5332 17.0234C13.1371 17.1443 12.9134 17.5638 13.0342 17.96C13.1552 18.3557 13.5748 18.5786 13.9707 18.458C16.1161 17.804 17.8066 16.1119 18.459 13.9658C18.5794 13.5696 18.3561 13.1508 17.96 13.0303ZM12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10ZM10.9648 6.04199C10.844 5.64579 10.4245 5.42214 10.0283 5.54297C7.88255 6.19746 6.19168 7.89105 5.54004 10.0381C5.42026 10.4342 5.64393 10.8534 6.04004 10.9736C6.43611 11.0937 6.85507 10.8695 6.97559 10.4736C7.48194 8.8053 8.79848 7.4872 10.4658 6.97852C10.8618 6.85774 11.0853 6.43804 10.9648 6.04199Z" fill="currentColor" />
      </svg>
    );
  },
);
KocteauSongIcon.displayName = "KocteauSongIcon";
