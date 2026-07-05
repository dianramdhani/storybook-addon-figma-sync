import { Map, MonitorDot, Scaling, Sparkles, TrendingDown, Zap } from 'lucide-react';

import { SectionHeading } from '@/stories/section-heading';

import { BenefitCard, type CardData } from './benefit-card';

const CARDS: CardData[] = [
  {
    title: 'Reduce Operational Effort',
    description:
      'Eliminate repetitive manual device management activities through monitoring, configuration, and operational control.',
    icon: <TrendingDown className="size-8 text-muted-foreground" />,
    highlightText: '40-70%',
    suffixText: ' Reduction in manual operational activities',
    paddingClass: 'lg:pb-[64px]',
    leftOffset: 'lg:left-[0px]',
  },
  {
    title: 'Improve Infrastructure Visibility',
    description:
      'Consolidate device health, status, inventory, and operational alerts into a unified operational view.',
    icon: <MonitorDot className="size-8 text-muted-foreground" />,
    highlightText: 'Up to 80%',
    suffixText: ' Faster infrastructure visibility',
    paddingClass: 'lg:pt-[64px]',
    leftOffset: 'lg:left-[244px]',
  },
  {
    title: 'Reduce Site Visits & Support Cost',
    description:
      'Enable remote monitoring and configuration to minimize unnecessary field dispatches and operational travel.',
    icon: <Map className="size-8 text-muted-foreground" />,
    highlightText: '60-80%',
    suffixText: ' Reduction in site visit',
    paddingClass: 'lg:pb-[64px]',
    leftOffset: 'lg:left-[488px]',
  },
  {
    title: 'Accelerate Incident Response',
    description:
      'Detect, identify, and respond to device-related issues faster through centralized monitoring and alerting.',
    icon: <Zap className="size-8 text-muted-foreground" />,
    highlightText: '40-70%',
    suffixText: ' Faster incident identification',
    paddingClass: 'lg:pt-[64px]',
    leftOffset: 'lg:left-[732px]',
  },
  {
    title: 'Scale Operations with Confidence',
    description:
      'Manage hundreds or thousands of distributed devices through standardized governance and centralized administration.',
    icon: <Scaling className="size-8 text-muted-foreground" />,
    highlightText: '50-80%',
    suffixText: ' Faster deployment readiness',
    paddingClass: 'lg:pb-[64px]',
    leftOffset: 'lg:left-[976px]',
  },
];

export function Benefits() {
  return (
    <section
      id="benefits"
      data-story-root
      className="section-container flex flex-col justify-start py-10 lg:overflow-hidden lg:py-16"
    >
      <div className="flex w-full flex-col gap-10">
        <SectionHeading
          align="center"
          icon={Sparkles}
          badgeText="Benefits"
          title="Take Control of Every Device"
          description="Maintain operational consistency as your network continues to grow."
        />
        <div className="relative grid h-auto w-full grid-cols-2 gap-4 lg:mx-auto lg:block lg:h-120 lg:w-7xl">
          {CARDS.map((card, i) => (
            <BenefitCard key={i} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
