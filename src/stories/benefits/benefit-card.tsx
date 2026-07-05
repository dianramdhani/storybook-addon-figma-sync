import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Card, CardDescription, CardHeader, CardTitle } from '@/stories/ui/card';

export interface CardData {
  title: string;
  description: string;
  icon: ReactNode;
  highlightText: string;
  suffixText: string;
  paddingClass: string;
  leftOffset: string;
}

interface BenefitCardProps {
  card: CardData;
  index?: number;
}

export function BenefitCard({ card, index }: BenefitCardProps) {
  const isLastCard = index === 4;

  return (
    <div
      className={cn(
        'relative flex h-auto w-auto flex-col justify-center',
        'lg:absolute lg:top-10 lg:h-100 lg:w-76',
        'cursor-pointer hover:z-10',
        card.paddingClass,
        card.leftOffset,
        isLastCard && 'col-span-2 lg:col-auto',
      )}
    >
      <Card
        className={cn(
          'flex size-full flex-col items-start justify-start gap-6 rounded-2xl border-none p-6 shadow-lg',
          'transition-all duration-300 ease-in-out',
          'hover:bg-gradient-soft-blue hover:-translate-y-2 hover:shadow-xl',
        )}
      >
        <CardHeader className="flex flex-col gap-2.5 p-0">
          <CardTitle className="text-xl">{card.title}</CardTitle>
          <CardDescription className="lg:h-30">{card.description}</CardDescription>
        </CardHeader>

        <div className="flex size-8 items-center justify-center">{card.icon}</div>

        <div className="text-muted-foreground text-sm">
          <strong>{card.highlightText}</strong>
          {card.suffixText}
        </div>
      </Card>
    </div>
  );
}
