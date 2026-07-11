import React, { type ComponentType, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Badge } from '@/stories/ui/badge';

export interface SectionHeadingProps {
  icon?: ComponentType<{ className?: string; size?: number }>;
  badgeText?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  layout?: 'stack' | 'split';
  splitRatio?: '1/2' | '1/3' | '2/3' | '7/12';
}

export function SectionHeading({
  icon: Icon,
  badgeText,
  title,
  description,
  align = 'center',
  layout = 'stack',
  splitRatio = '1/2',
}: SectionHeadingProps) {
  const isCenter = align === 'center';
  const isSplit = layout === 'split';

  const getSplitGridClass = () => {
    return 'grid-cols-1 md:grid-cols-12';
  };

  const getTitleSpanClass = () => {
    if (!description) return 'md:col-span-12';
    switch (splitRatio) {
      case '1/3':
        return 'md:col-span-4';
      case '2/3':
        return 'md:col-span-8';
      case '7/12':
        return 'md:col-span-7';
      case '1/2':
      default:
        return 'md:col-span-6';
    }
  };

  const getDescriptionSpanClass = () => {
    switch (splitRatio) {
      case '1/3':
        return 'md:col-span-8';
      case '2/3':
        return 'md:col-span-4';
      case '7/12':
        return 'md:col-span-5';
      case '1/2':
      default:
        return 'md:col-span-6';
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', isCenter ? 'items-center' : 'items-start', isSplit && 'w-full')}>
      {(Icon || badgeText) && (
        <div className={cn('flex items-center gap-2', isCenter ? 'justify-center' : 'justify-start')}>
          {Icon && (
            <div className="bg-primary flex size-8 items-center justify-center rounded-lg p-2">
              <Icon size={16} className="text-primary-foreground" />
            </div>
          )}
          {badgeText && (
            <Badge variant="secondary" className="h-8 rounded-lg px-2 py-1 text-[13px] font-medium">
              {badgeText}
            </Badge>
          )}
        </div>
      )}

      {isSplit ? (
        <div className={cn('grid gap-6 w-full items-stretch', getSplitGridClass())}>
          <div className={cn('flex flex-col items-stretch', getTitleSpanClass())}>
            <h2 className="text-3xl md:text-6xl font-semibold text-foreground">{title}</h2>
          </div>
          {description && (
            <div className={cn('flex flex-col items-stretch pt-3', getDescriptionSpanClass())}>
              <p className="text-muted-foreground">{description}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <h2 className={cn('text-3xl font-semibold md:text-5xl', isCenter && 'text-center')}>{title}</h2>
          {description && (
            <p className={cn('text-muted-foreground', isCenter && 'max-w-xl text-center')}>{description}</p>
          )}
        </>
      )}
    </div>
  );
}
