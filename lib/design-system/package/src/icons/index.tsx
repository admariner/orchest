import { StitchesVariants, InternalCSS } from "@stitches/core";
import * as React from "react";
import { css, config } from "../core";
import { ICSSProp } from "../types";

const getSizes = Object.keys(config.theme.space).reduce(
  (acc, cv) => ({ ...acc, [`${cv}`]: { $$iconSize: `$space$${cv}` } }),
  {}
) as { [key in keyof typeof config.theme.space]: InternalCSS };

export const icon = css({
  color: "currentcolor",
  width: "$$iconSize",
  height: "$$iconSize",
  verticalAlign: "middle",
  variants: {
    size: {
      ...getSizes,
      full: { $$iconSize: "100%" },
    },
  },
  defaultVariants: {
    size: 5,
  },
});

export type IIconRef = SVGSVGElement;
export interface IIconProps
  extends StitchesVariants<typeof icon>,
    ICSSProp,
    React.SVGProps<IIconRef> {}

export const IconCheckSolid = React.forwardRef<IIconRef, IIconProps>(
  ({ className, css, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={icon({ className, css, size })}
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
);

export const IconCheckCircleOutline = React.forwardRef<IIconRef, IIconProps>(
  ({ className, css, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={icon({ className, css, size })}
      fill="none"
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
);

export const IconClockOutline = React.forwardRef<IIconRef, IIconProps>(
  ({ className, css, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={icon({ className, css, size })}
      fill="none"
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
);

export const IconClockSolid = React.forwardRef<IIconRef, IIconProps>(
  ({ className, css, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={icon({ className, css, size })}
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
        clipRule="evenodd"
      />
    </svg>
  )
);

export const IconCrossSolid = React.forwardRef<IIconRef, IIconProps>(
  ({ className, css, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={icon({ className, css, size })}
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
);

export const IconCrossCircleOutline = React.forwardRef<IIconRef, IIconProps>(
  ({ className, css, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={icon({ className, css, size })}
      fill="none"
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
);

export const IconChevronLeftOutline = React.forwardRef<IIconRef, IIconProps>(
  ({ className, css, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={icon({ className, css, size })}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  )
);

/** @deprecated replaced by IconChevronLeftOutline */
export const IconChevronLeft = IconChevronLeftOutline;

export const IconChevronRightOutline = React.forwardRef<IIconRef, IIconProps>(
  ({ className, css, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={icon({ className, css, size })}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  )
);

/** @deprecated replaced by IconChevronRightOutline */
export const IconChevronRight = IconChevronRightOutline;

export const IconDraftOutline = React.forwardRef<IIconRef, IIconProps>(
  ({ css, className, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={icon({ className, css, size })}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  )
);

export const IconDraftCircleOutline = React.forwardRef<IIconRef, IIconProps>(
  ({ className, css, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={icon({ className, css, size })}
      fill="currentColor"
      {...props}
    >
      <path d="M15.5355 9.8787C15.9261 9.48817 15.9261 8.85501 15.5355 8.46448C15.145 8.07396 14.5118 8.07396 14.1213 8.46448L15.5355 9.8787ZM8.47154 14.1284C8.08101 14.5189 8.08101 15.1521 8.47154 15.5426C8.86206 15.9331 9.49523 15.9331 9.88575 15.5426L8.47154 14.1284ZM18.364 5.63606L17.6569 6.34316L18.364 5.63606ZM14.1213 8.46448L10.2929 12.2929L11.7071 13.7071L15.5355 9.8787L14.1213 8.46448ZM17.6569 17.6569C16.914 18.3997 16.0321 18.989 15.0615 19.3911L15.8268 21.2388C17.0401 20.7363 18.1425 19.9997 19.0711 19.0711L17.6569 17.6569ZM15.0615 19.3911C14.0909 19.7931 13.0506 20 12 20V22C13.3132 22 14.6136 21.7414 15.8268 21.2388L15.0615 19.3911ZM12 20C10.9494 20 9.90914 19.7931 8.93853 19.3911L8.17317 21.2388C9.38642 21.7414 10.6868 22 12 22V20ZM8.93853 19.3911C7.96793 18.989 7.08601 18.3997 6.34315 17.6569L4.92893 19.0711C5.85752 19.9997 6.95991 20.7363 8.17317 21.2388L8.93853 19.3911ZM6.34315 17.6569C5.60028 16.914 5.011 16.0321 4.60896 15.0615L2.7612 15.8269C3.26375 17.0401 4.00035 18.1425 4.92893 19.0711L6.34315 17.6569ZM4.60896 15.0615C4.20693 14.0909 4 13.0506 4 12L2 12C2 13.3132 2.25866 14.6136 2.7612 15.8269L4.60896 15.0615ZM4 12C4 10.9494 4.20693 9.90915 4.60896 8.93855L2.7612 8.17318C2.25866 9.38644 2 10.6868 2 12L4 12ZM4.60896 8.93855C5.011 7.96794 5.60028 7.08603 6.34315 6.34316L4.92893 4.92895C4.00035 5.85753 3.26375 6.95993 2.7612 8.17318L4.60896 8.93855ZM6.34315 6.34316C7.84344 4.84287 9.87827 4.00002 12 4.00002V2.00002C9.34784 2.00002 6.8043 3.05359 4.92893 4.92895L6.34315 6.34316ZM12 4.00002C14.1217 4.00002 16.1566 4.84287 17.6569 6.34316L19.0711 4.92895C17.1957 3.05359 14.6522 2.00002 12 2.00002V4.00002ZM17.6569 6.34316C19.1571 7.84345 20 9.87828 20 12L22 12C22 9.34785 20.9464 6.80431 19.0711 4.92895L17.6569 6.34316ZM20 12C20 14.1217 19.1571 16.1566 17.6569 17.6569L19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12L20 12ZM9.29289 13.3071L8.47154 14.1284L9.88575 15.5426L10.7071 14.7213L9.29289 13.3071Z" />
    </svg>
  )
);

export const IconLightBulbOutline = React.forwardRef<IIconRef, IIconProps>(
  ({ css, className, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={icon({ className, css, size })}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  )
);

/** @deprecated replaced by IconLightBulbOutline */
export const IconLightBulb = IconLightBulbOutline;

export const IconWarningOutline = React.forwardRef<IIconRef, IIconProps>(
  ({ css, className, size, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={icon({ className, css, size })}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
);

/** @deprecated replaced by IconWarningOutline */
export const IconWarning = IconWarningOutline;
