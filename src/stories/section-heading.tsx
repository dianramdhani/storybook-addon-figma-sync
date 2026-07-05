import type { ComponentType, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Badge } from '@/stories/ui/badge';

export interface SectionHeadingProps {
  icon?: ComponentType<{ className?: string; size?: number }>;
  badgeText?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
}

export function SectionHeading({ icon: Icon, badgeText, title, description, align = 'center' }: SectionHeadingProps) {
  const isCenter = align === 'center';

  return (
    <div className={cn('flex flex-col gap-4', isCenter ? 'items-center' : 'items-start')}>
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

      <h2 className={cn('text-3xl font-semibold md:text-5xl', isCenter && 'text-center')}>{title}</h2>

      {description && <p className={cn('text-muted-foreground', isCenter && 'max-w-xl text-center')}>{description}</p>}
    </div>
  );
}
