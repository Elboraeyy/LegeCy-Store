"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";
import { Reveal } from "@/components/ui/Reveal";
import { useUncontrolledFormPersistence } from "@/hooks/useFormPersistence";


export default function ContactClient() {
  const { showToast } = useStore();
  const { containerRef, clearAll } = useUncontrolledFormPersistence('contact_form');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    // Use the global toast from context if available, otherwise fallback or just log
    if (showToast) {
        showToast("Message sent. Thank you!", "success");
    } else {
        // Fallback simulation if context not ready (though it should be)
         const toast = document.createElement("div");
        toast.className = "toast-message";
        toast.innerText = "Message sent. Thank you!";
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.padding = "12px 24px";
        toast.style.background = "#142f29"; 
        toast.style.color = "#fff";
        toast.style.borderRadius = "4px";
        toast.style.zIndex = "1000";
        toast.style.animation = "fadeIn 0.5s, fadeOut 0.5s 2.5s";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    form.reset();
    clearAll(); // Clear persisted form data
  };

  return (

      <main>
        <section className="shop-hero">
          <div className="container">
            <Reveal>
               <h1 className="fade-in">Concierge</h1>
            </Reveal>
            <Reveal delay={0.2}>
               <p className="fade-in">Our dedicated team is at your service.</p>
            </Reveal>
          </div>
        </section>

        <section className="container" style={{ marginBottom: "80px" }}>
          <div className="cart-layout">
            <div className="contact-info">
               <Reveal>
                  <h3
                    className="detail-title-large"
                    style={{ fontSize: "32px", marginBottom: "24px" }}
                  >
                    Exquisite Service
                  </h3>
               </Reveal>
               <Reveal delay={0.1}>
                  <p className="detail-desc">
                    Whether you are inquiring about a specific timepiece, require
                    assistance with your acquisition, or simply wish to learn more
                    about Legacy, we are here to assist you.
                  </p>
               </Reveal>
               <Reveal width="100%" delay={0.2}>
                  <div className="specs-list" style={{ marginTop: "40px" }}>
                    <ul>
                      <li>
                        <strong>Email:</strong> legacy@gmail.com
                      </li>
                      <li>
                        <strong>Phone:</strong> +20 12 7934 2177
                      </li>
                      <li>
                        <strong>Hours:</strong> Every day, 10am - 10pm
                      </li>
                    </ul>
                  </div>
               </Reveal>
            </div>

            <div className="contact-form-wrapper">
               <Reveal delay={0.3} width="100%">
                  <form ref={containerRef} id="contact-form" onSubmit={handleSubmit} aria-labelledby="contact-title">
                    <h3
                      id="contact-title"
                      style={{
                        marginBottom: "24px",
                        fontSize: "24px",
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      Send a Message
                    </h3>

                    <label className="sr-only" htmlFor="name">
                      Your Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="Name"
                      required
                      style={{ marginTop: 0 }}
                    />

                    <label className="sr-only" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="Email"
                      required
                    />

                    <label className="sr-only" htmlFor="message">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="How can we help?"
                      rows={5}
                      required
                    ></textarea>

                    <button type="submit" className="btn btn-primary btn-block" style={{ width: '100%' }}>
                      Send Message
                    </button>
                  </form>
               </Reveal>
            </div>
          </div>
        </section>
      </main>

  );
}
