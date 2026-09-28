import Image from "next/image";
import Link from "next/link";

import { PublicHeader } from "@/components/public-header";

const foundationAreas = [
  {
    number: "01",
    title: "Season-led menu",
    description:
      "Warm, familiar dishes with bright produce and thoughtful finishing touches.",
  },
  {
    number: "02",
    title: "Easy choices",
    description:
      "Clear availability, considered options, and a comfortable path from browse to table.",
  },
  {
    number: "03",
    title: "One kitchen",
    description:
      "A focused fictional restaurant experience, designed with operational care.",
  },
];

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="overflow-hidden bg-[#f7f1e8]">
          <div className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-[90rem] items-center gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12 lg:px-12 lg:py-16">
            <div className="relative z-1 max-w-2xl py-4 lg:py-12">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">
                Modern comfort · thoughtfully served
              </p>
              <h1 className="mt-6 text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-ink sm:text-7xl lg:text-[5.6rem]">
                A warmer way to gather around food.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-muted sm:text-lg">
                Copper Spoon brings familiar dishes, seasonal produce, and an easygoing dining spirit to one modern fictional kitchen.
              </p>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_36px_-20px_rgba(45,27,20,0.75)] transition hover:bg-copper sm:w-auto"
                  href="/menu"
                >
                  Browse the menu
                </Link>
                <span className="text-sm text-muted">
                  Fictional dishes · real product craft
                </span>
              </div>
            </div>

            <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] bg-[#d9c4b0] shadow-[0_36px_90px_-45px_rgba(45,27,20,0.75)] sm:min-h-[34rem] lg:min-h-[44rem]">
              <Image
                alt="Copper Spoon table spread with a burger, herb fries, grain bowl, tomato toast, seasonal greens, citrus drink, and chocolate torte"
                className="object-cover"
                fill
                preload
                sizes="(max-width: 1024px) calc(100vw - 2.5rem), 58vw"
                src="/images/hero/hero-copper-spoon.webp"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2d1b14]/65 to-transparent px-6 pb-6 pt-20 text-white sm:px-8 sm:pb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f4ceb5]">
                  From the Copper Spoon kitchen
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/85">
                  Seasonal color, handmade tableware, and relaxed plates designed for sharing.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#3e2920]/10 bg-[#fffaf2]">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-copper">
                  The experience
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                  Made to feel considered, never formal.
                </h2>
              </div>
              <Link
                className="w-fit rounded-md text-sm font-semibold text-ink underline decoration-copper/40 underline-offset-4 transition hover:text-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
                href="/menu"
              >
                See today&apos;s menu →
              </Link>
            </div>

            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {foundationAreas.map((area) => (
                <li
                  className="rounded-[1.4rem] border border-[#3e2920]/10 bg-[#f7f1e8] p-6"
                  key={area.number}
                >
                  <span className="text-xs font-semibold tracking-[0.18em] text-copper">
                    {area.number}
                  </span>
                  <h3 className="mt-8 text-xl font-semibold text-ink">
                    {area.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {area.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </>
  );
}
