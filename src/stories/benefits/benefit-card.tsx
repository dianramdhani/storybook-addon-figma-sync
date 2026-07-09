import React, { type ReactNode } from 'react';

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
        'relative flex h-auto w-full flex-col justify-center',
        'md:min-h-82.5 lg:absolute lg:top-10 lg:h-100 lg:w-76',
        'cursor-pointer hover:z-10',
        card.paddingClass,
        card.leftOffset,
        isLastCard && 'md:col-span-2 lg:col-auto',
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
          <CardTitle className="text-[26px] leading-tight">{card.title}</CardTitle>
          <CardDescription className="text-[17px] leading-7 lg:h-30">{card.description}</CardDescription>
        </CardHeader>

        <div className="flex size-8 items-center justify-center">{card.icon}</div>

        <div className="text-muted-foreground text-[16px] leading-6">
          <strong>{card.highlightText}</strong>
          {card.suffixText}
        </div>
      </Card>
    </div>
  );
}
