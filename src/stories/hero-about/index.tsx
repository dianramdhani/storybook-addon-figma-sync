import React from 'react';

import { SectionHeading } from '@/stories/section-heading';

import logoUrl from './logo.svg';

const LogoIcon = ({ className, size }: { className?: string; size?: number }) => (
  <img src={logoUrl} style={{ width: size, height: size }} alt="Product Logo" className={className} />
);

interface MetricItemProps {
  value: string;
  label: string;
}

function MetricItem({ value, label }: MetricItemProps) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[60px] font-semibold leading-15 tracking-[-0.0008em] text-primary text-center">
        {value}
      </span>
      <span className="text-[18px] font-semibold leading-7 text-foreground text-center">{label}</span>
    </div>
  );
}

export function HeroAbout() {
  const metrics = [
    { value: '1.000+', label: 'Device Managed' },
    { value: '50+', label: 'Nationwide Deployment' },
    { value: '100+', label: 'Business Connected' },
    { value: '200+', label: 'Active Users' },
  ];

  return (
    <section
      id="hero-about"
      data-story-root
      className="section-container  pt-45 pb-16 flex flex-col items-stretch overflow-hidden bg-background bg-[linear-gradient(180deg,#f0f8ff_0%,transparent_442px)]"
    >
      <div className=" flex flex-col gap-16  max-w-344! mx-auto">
        <SectionHeading
          align="left"
          layout="split"
          splitRatio="1/2"
          icon={LogoIcon}
          badgeText="About SENTRI"
          title="Empowering Connected Operations"
          description="SENTRI is a centralized Device Management Platform that empowers organizations to gain complete visibility and control over their connected devices and network infrastructure. Built for modern operations, SENTRI simplifies monitoring, configuration, and lifecycle management while helping businesses improve reliability, security, and operational performance at scale."
        />

        {/* Metrics section */}
        <div className="grid grid-col lg:grid-cols-4 p-6 gap-x-8 gap-y-12 bg-gradient-soft-blue rounded-2xl">
          {metrics.map((metric, i) => (
            <MetricItem key={i} value={metric.value} label={metric.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
