import * as React from 'react';

import { cn } from '~/lib/utils';

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'p'
  | 'blockquote'
  | 'code'
  | 'lead'
  | 'large'
  | 'small'
  | 'muted';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant: TypographyVariant;
  children?: React.ReactNode;
}

const TYPOGRAPHY_CONFIG: Record<
  TypographyVariant | 'default',
  { tag: keyof React.JSX.IntrinsicElements; className: string }
> = {
  h1: {
    tag: 'h1',
    className: 'scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance',
  },
  h2: {
    tag: 'h2',
    className: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
  },
  h3: {
    tag: 'h3',
    className: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  },
  h4: {
    tag: 'h4',
    className: 'scroll-m-20 text-xl font-semibold tracking-tight',
  },
  blockquote: {
    tag: 'blockquote',
    className: 'mt-6 border-l-2 pl-6 italic',
  },
  code: {
    tag: 'code',
    className: 'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
  },
  lead: {
    tag: 'p',
    className: 'text-muted-foreground text-xl',
  },
  large: {
    tag: 'p',
    className: 'text-lg font-semibold',
  },
  small: {
    tag: 'p',
    className: 'text-sm leading-none font-medium',
  },
  muted: {
    tag: 'p',
    className: 'text-muted-foreground text-sm',
  },
  p: {
    tag: 'p',
    className: 'leading-7 [&:not(:first-child)]:mt-6',
  },
  default: {
    tag: 'p',
    className: 'leading-7 [&:not(:first-child)]:mt-6',
  },
};

export const Typography = ({ variant, children, ...props }: TypographyProps) => {
  const { tag: Tag, className } = TYPOGRAPHY_CONFIG[variant] || TYPOGRAPHY_CONFIG.default;
  return (
    <Tag {...props} className={cn(className, props.className)}>
      {children}
    </Tag>
  );
};
