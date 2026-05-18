import * as React from 'react'

import type { VariantProps } from 'class-variance-authority'

import { Button, type buttonVariants } from '@/components/ui/button'

import { cn } from '@/lib/utils'

interface GrowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: VariantProps<typeof buttonVariants>['size']
  children?: React.ReactNode
  asChild?: boolean
}

function PrimaryGrowButton(props: GrowButtonProps) {
  const { children, asChild = false, size, className, ...rest } = props

  return (
    <Button
      size={size}
      asChild={asChild}
      className={cn(
        'rounded-lg duration-200 ease-in-out active:-translate-x-0.5 active:translate-y-0.5',

        // default shadows
        '[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,white_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_9px_21.7px_3px_color-mix(in_oklab,var(--primary)_40%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,white_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)] dark:[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,black_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_9px_21.7px_3px_color-mix(in_oklab,var(--primary)_40%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,black_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)]',

        // shadows on active state
        'active:[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,white_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_7px_12px_0px_color-mix(in_oklab,var(--primary)_60%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,white_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)] dark:active:[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,black_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_7px_12px_0px_color-mix(in_oklab,var(--primary)_60%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,black_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)]',

        // shadows on focus state
        'focus-visible:[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,white_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_7px_12px_0px_color-mix(in_oklab,var(--primary)_60%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,white_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)] dark:focus-visible:[box-shadow:0px_1px_8px_0px_color-mix(in_oklab,black_7%,transparent)_inset,0px_0px_4.3px_0px_color-mix(in_oklab,var(--primary)_11%,transparent)_inset,0px_0px_0px_2.5px_var(--primary),0px_7px_12px_0px_color-mix(in_oklab,var(--primary)_60%,transparent),0px_-1px_0px_1px_color-mix(in_oklab,black_18%,transparent)_inset,0px_4px_4px_0px_color-mix(in_oklab,var(--primary)_16%,transparent)]',

        // size-based adjustments
        size === 'lg' && 'text-base has-[>svg]:px-6',

        className
      )}
      {...rest}
    >
      {children}
    </Button>
  )
}

function SecondaryGrowButton(props: GrowButtonProps) {
  const { children, size, asChild = false, className, ...rest } = props

  return (
    <Button
      variant='secondary'
      size={size}
      asChild={asChild}
      className={cn(
        'text-primary cursor-pointer rounded-lg border border-[color-mix(in_oklab,_var(--primary)_30%,_var(--card))] bg-[color-mix(in_oklab,_var(--primary)_10%,_var(--card))] hover:bg-[color-mix(in_oklab,_var(--primary)_15%,_var(--card))] active:scale-95',

        // size-based adjustments
        size === 'lg' && 'text-base has-[>svg]:px-6',

        className
      )}
      {...rest}
    >
      {children}
    </Button>
  )
}

export { PrimaryGrowButton, SecondaryGrowButton, type GrowButtonProps }
