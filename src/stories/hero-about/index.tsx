import React from 'react';

export function HeroAbout() {
  return (
    <section
      data-story-root
      className="flex flex-col bg-[linear-gradient(180deg,#eef6ff_0%,#f7fbff_40%,#ffffff_70%,#eef6ff_100%)] text-foreground"
    >
      {/* Hero top */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,80,149,0.06),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(0,80,149,0.04),transparent_30%)]" />

        <div className="relative mx-auto flex w-full max-w-[1280px] flex-col px-6 pb-10 pt-[130px] md:px-10 lg:px-0">
          {/* Badge */}
          <div className="mb-6 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary shadow-[0_6px_18px_rgba(0,80,149,0.16)]">
              <svg
                viewBox="0 0 24 24"
                className="size-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3.5 18.5 7v10L12 20.5 5.5 17V7L12 3.5Z" />
                <path d="m8.5 9 3.5-2 3.5 2-3.5 2-3.5-2Z" />
                <path d="m8.5 15 3.5-2 3.5 2-3.5 2-3.5-2Z" />
                <path d="M12 9v4" />
              </svg>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-[13px] font-medium tracking-[-0.01em] text-black shadow-[0_1px_0_rgba(255,255,255,0.7)]">
              About SENTRI
            </span>
          </div>

          {/* Heading + description grid */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:items-end lg:gap-12">
            <h1 className="max-w-[760px] text-[52px] font-semibold leading-[0.96] tracking-[-0.06em] text-[#0b0f14] md:text-[72px] lg:text-[66px] xl:text-[70px]">
              Empowering Connected
              <br />
              Operations
            </h1>

            <p className="max-w-[620px] text-[16px] leading-[1.56] tracking-[-0.01em] text-[#787878] md:text-[18px] lg:pb-2">
              SENTRI is a centralized Device Management Platform that empowers organizations to gain complete visibility
              and control over their connected devices and network infrastructure. Built for modern operations, SENTRI
              simplifies monitoring, configuration, and lifecycle management while helping businesses improve
              reliability, security, and operational performance at scale.
            </p>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="px-6 pb-10 pt-8 md:px-10 lg:px-0">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="rounded-[18px] bg-[#eef6ff] px-8 py-10 md:px-10 md:py-12">
            <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-y-0">
              <Stat value="1.000+" label="Device Managed" />
              <Stat value="50+" label="Nationwide Deployment" />
              <Stat value="100+" label="Business Connected" />
              <Stat value="200+" label="Active Users" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="text-[52px] font-semibold leading-none tracking-[-0.05em] text-primary md:text-[58px]">
        {value}
      </div>
      <div className="text-[16px] font-semibold leading-tight tracking-[-0.02em] text-[#151515] md:text-[18px]">
        {label}
      </div>
    </div>
  );
}
