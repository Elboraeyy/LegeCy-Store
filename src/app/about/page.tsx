import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Our Heritage | Legacy Store",
  description: "Discover Legacy Store - Egypt's destination for premium accessories, watches, wallets, and more.",
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
            <p className="fade-in">Your destination for premium accessories and timeless style.</p>
          </Reveal>
        </div>
      </section>

      <section className="container" style={{ marginBottom: "80px" }}>
        <div className="grid detail-split" style={{ alignItems: "stretch" }}>
          <div>
            <Reveal>
                <h2 className="detail-title-large" style={{ fontSize: "36px", marginBottom: "24px" }}>
                Your Style Destination
                </h2>
            </Reveal>
            <Reveal delay={0.2}>
                <p className="detail-desc">
                At Legacy, we believe that accessories are more than just items—they are companions through life's
                defining moments. Founded on the principles of quality and understated elegance, we've become
                Egypt's trusted destination for premium accessories.
                </p>
                <p className="detail-desc" style={{ marginBottom: 0 }}>
                Whether you're looking for the perfect watch, wallet, or accessory, we invite you to explore our
                curated collection. Here, quality meets style in perfect harmony.
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
              <h3 style={{ border: "none", fontSize: "24px" }}>Quality Selection</h3>
              <p style={{ color: "var(--text-muted)" }}>Carefully curated products from trusted brands.</p>
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
              <p style={{ color: "var(--text-muted)" }}>Dedicated support for every purchase you make.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Team Section */}
      <section className="container" style={{ marginBottom: "80px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "36px",
              marginBottom: "16px",
              color: "var(--primary)"
            }}>
              Meet Our Team
            </h2>
            <p style={{
              color: "var(--text-muted)",
              maxWidth: "700px",
              margin: "0 auto",
              fontSize: "16px",
              lineHeight: "1.8"
            }}>
              Behind LegaCy is a dedicated team of professionals passionate about delivering the best
              accessories and exceptional customer experience. From managing operations to creating
              content, our team works together to make your shopping experience seamless.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Mohamed Elboraey - CEO */}
          <Reveal delay={0.05}>
            <a
              href="https://instagram.com/e.l.b.o.r.a.e.y"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <div style={{
                background: "var(--surface)",
                borderRadius: "12px",
                padding: "24px 16px",
                textAlign: "center",
                border: "1px solid var(--border-light)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
              }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  margin: "0 auto 16px",
                  border: "3px solid var(--accent)",
                  position: "relative",
                }}>
                  <Image src="/image/team/mohamed-elboraey.jpg" alt="Mohamed Elboraey" fill style={{ objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "4px", fontFamily: "var(--font-heading)", color: "var(--primary)" }}>
                  Mohamed Elboraey
                </h3>
                <p style={{ color: "var(--accent)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>
                  CEO & CTO
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  @e.l.b.o.r.a.e.y
                </div>
              </div>
            </a>
          </Reveal>

          {/* Ezzat Hussein - Supervisor */}
          <Reveal delay={0.1}>
            <a href="https://instagram.com/ezzat_hussen22" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "24px 16px", textAlign: "center", border: "1px solid var(--border-light)", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "pointer" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "3px solid var(--accent)", position: "relative" }}>
                  <Image src="/image/team/ezzat-hussein.jpeg" alt="Ezzat Hussein" fill style={{ objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "4px", fontFamily: "var(--font-heading)", color: "var(--primary)" }}>Ezzat Hussein</h3>
                <p style={{ color: "var(--accent)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>Supervisor</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  @ezzat_hussen22
                </div>
              </div>
            </a>
          </Reveal>

          {/* Karim Elboraey - HR Manager */}
          <Reveal delay={0.15}>
            <a href="https://instagram.com/3m_elkemoo" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "24px 16px", textAlign: "center", border: "1px solid var(--border-light)", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "pointer" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "3px solid var(--accent)", position: "relative" }}>
                  <Image src="/image/team/karim-elboraey.jpeg" alt="Karim Elboraey" fill style={{ objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "4px", fontFamily: "var(--font-heading)", color: "var(--primary)" }}>Karim Elboraey</h3>
                <p style={{ color: "var(--accent)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>HR Manager</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  @3m_elkemoo
                </div>
              </div>
            </a>
          </Reveal>

          {/* Ehab Tarek - CMO */}
          <Reveal delay={0.2}>
            <a href="https://instagram.com/ehab_tarek_2" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "24px 16px", textAlign: "center", border: "1px solid var(--border-light)", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "pointer" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "3px solid var(--accent)", position: "relative" }}>
                  <Image src="/image/team/ehab-tarek.jpeg" alt="Ehab Tarek" fill style={{ objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "4px", fontFamily: "var(--font-heading)", color: "var(--primary)" }}>Ehab Tarek</h3>
                <p style={{ color: "var(--accent)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>Marketing Director</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  @ehab_tarek_2
                </div>
              </div>
            </a>
          </Reveal>

          {/* Hossam Masoud - CMO */}
          <Reveal delay={0.25}>
            <a href="https://instagram.com/hossam_masoudd" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "24px 16px", textAlign: "center", border: "1px solid var(--border-light)", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "pointer" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "3px solid var(--accent)", position: "relative" }}>
                  <Image src="/image/team/hossam-masoud.jpeg" alt="Hossam Masoud" fill style={{ objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "4px", fontFamily: "var(--font-heading)", color: "var(--primary)" }}>Hossam Masoud</h3>
                <p style={{ color: "var(--accent)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>Content Creator</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  @hossam_masoudd
                </div>
              </div>
            </a>
          </Reveal>

          {/* Yousef Elboraey - Customer Support Lead */}
          <Reveal delay={0.3}>
            <a href="https://instagram.com/youssefelbora3y" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "24px 16px", textAlign: "center", border: "1px solid var(--border-light)", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "pointer" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "3px solid var(--accent)", position: "relative" }}>
                  <Image src="/image/team/yousef-elboraey.jpeg" alt="Yousef Elboraey" fill style={{ objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "4px", fontFamily: "var(--font-heading)", color: "var(--primary)" }}>Yousef Elboraey</h3>
                <p style={{ color: "var(--accent)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>Customer Support Lead</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  @youssefelbora3y
                </div>
              </div>
            </a>
          </Reveal>

          {/* Moataz Mohamed - Inventory Manager */}
          <Reveal delay={0.35}>
            <a href="https://instagram.com/mo3taz_mo7mad" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "24px 16px", textAlign: "center", border: "1px solid var(--border-light)", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "pointer" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "3px solid var(--accent)", position: "relative" }}>
                  <Image src="/image/team/moataz-mohamed.jpeg" alt="Moataz Mohamed" fill style={{ objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "4px", fontFamily: "var(--font-heading)", color: "var(--primary)" }}>Moataz Mohamed</h3>
                <p style={{ color: "var(--accent)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>Inventory Manager</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  @mo3taz_mo7mad
                </div>
              </div>
            </a>
          </Reveal>

          {/* Ahmed ElSaidy - Purchasing */}
          <Reveal delay={0.4}>
            <a href="https://instagram.com/a7med___ma7moud7" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "24px 16px", textAlign: "center", border: "1px solid var(--border-light)", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "pointer" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "3px solid var(--accent)", position: "relative" }}>
                  <Image src="/image/team/ahmed-elsaidy.jpg" alt="Ahmed ElSaidy" fill style={{ objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "4px", fontFamily: "var(--font-heading)", color: "var(--primary)" }}>Ahmed ElSaidy</h3>
                <p style={{ color: "var(--accent)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>Purchasing</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  @a7med___ma7moud7
                </div>
              </div>
            </a>
          </Reveal>

          {/* Malek Khalifa - Purchasing */}
          <Reveal delay={0.45}>
            <a href="https://instagram.com/malekkhalifa72" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "24px 16px", textAlign: "center", border: "1px solid var(--border-light)", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "pointer" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "3px solid var(--accent)", position: "relative" }}>
                  <Image src="/image/team/malek-khalifaa.jpeg" alt="Malek Khalifa" fill style={{ objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "4px", fontFamily: "var(--font-heading)", color: "var(--primary)" }}>Malek Khalifa</h3>
                <p style={{ color: "var(--accent)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>Purchasing</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  @malekkhalifa72
                </div>
              </div>
            </a>
          </Reveal>
        </div>
      </section>
    </main>

  );
}
