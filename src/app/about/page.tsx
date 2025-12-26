import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Our Heritage | Legacy Store",
  description: "Explore the history of Legacy Store. Crafting precision timepieces since 1839.",
};


export default function About() {
  return (

    <main>
      <section className="shop-hero">
        <div className="container">
          <Reveal>
             <h1 className="fade-in">Our Heritage</h1>
          </Reveal>
          <Reveal delay={0.2}>
             <p className="fade-in">A legacy built on precision, elegance, and timeless design.</p>
          </Reveal>
        </div>
      </section>

      <section className="container" style={{ marginBottom: "80px" }}>
        <div className="grid detail-split" style={{ alignItems: "stretch" }}>
          <div>
            <Reveal>
                <h2 className="detail-title-large" style={{ fontSize: "36px", marginBottom: "24px" }}>
                  The Art of Time
                </h2>
            </Reveal>
            <Reveal delay={0.2}>
                <p className="detail-desc">
                  At Legacy, we believe that a watch is more than a device to tell time—it is a companion through life’s
                  defining moments. Founded on the principles of unyielding quality and understated elegance, our marque has become
                  synonymous with quiet luxury.
                </p>
                <p className="detail-desc" style={{ marginBottom: 0 }}>
                  Whether you are an avid collector or simply wish to learn more about Legacy, we invite you to explore our
                  world. Here, tradition meets modernity in perfect harmony.
                </p>
            </Reveal>
          </div>
          <div
            className="main-image-wrapper"
            style={{ marginLeft: "auto", marginRight: "40px", height: "100%", aspectRatio: "auto", position: "relative" }}
          >
           <Reveal width="100%" fullHeight>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image
                    src="/image/rowan whitethorn _ throne of glass.jpeg"
                    alt="About Legacy"
                    className="about-img-full"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: "cover" }}
                  />
              </div>
            </Reveal>
          </div>
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "40px",
            marginTop: "60px",
          }}
        >
          <Reveal width="100%" delay={0.3}>
              <div className="specs-list" style={{ textAlign: "center" }}>
                <h3 style={{ border: "none", fontSize: "24px" }}>Craftsmanship</h3>
                <p style={{ color: "var(--text-muted)" }}>Uncompromising attention to detail in every component.</p>
              </div>
          </Reveal>
          <Reveal width="100%" delay={0.4}>
              <div className="specs-list" style={{ textAlign: "center" }}>
                <h3 style={{ border: "none", fontSize: "24px" }}>Authenticity</h3>
                <p style={{ color: "var(--text-muted)" }}>Every piece is verified and certified by our experts.</p>
              </div>
          </Reveal>
          <Reveal width="100%" delay={0.5}>
              <div className="specs-list" style={{ textAlign: "center" }}>
                <h3 style={{ border: "none", fontSize: "24px" }}>Service</h3>
                <p style={{ color: "var(--text-muted)" }}>Dedicated support for the lifetime of your timepiece.</p>
              </div>
           </Reveal>
        </div>
      </section>
    </main>

  );
}
