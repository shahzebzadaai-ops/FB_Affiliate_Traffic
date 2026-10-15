"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { BackgroundVideo } from "@/components/public/background-video";
import { FadeIn } from "@/components/public/fade-in";

const NAV = [
  { href: "#about", label: "About" },
  { href: "#features", label: "What We Do" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

const VALUES = [
  { name: "Storytelling", icon: StoryIcon },
  { name: "Creativity", icon: CreateIcon },
  { name: "Discovery", icon: DiscoverIcon },
  { name: "Connection", icon: ConnectIcon },
  { name: "Perspective", icon: FrameIcon },
] as const;

const QUESTIONS = [
  {
    q: "What is AffiGrove Media Group?",
    a: "AffiGrove is an independent digital media company focused on engaging content, audience experiences and thoughtful commercial partnerships.",
  },
  {
    q: "What kind of digital experiences do you create?",
    a: "We develop creative digital media concepts centred on storytelling, discovery and audience relevance. Our work is guided by quality, originality and meaningful engagement.",
  },
  {
    q: "How can brands work with AffiGrove?",
    a: "We welcome conversations about suitable media collaborations, brand partnerships and commercial opportunities that align with our audiences and editorial direction.",
  },
  {
    q: "Where does AffiGrove operate?",
    a: "Our initial focus is the United Kingdom, with a long-term outlook toward broader digital media opportunities.",
  },
  {
    q: "How can I contact your team?",
    a: "Use the contact options below to reach AffiGrove Media Group with partnership, business or general enquiries.",
  },
];

function StoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.5h6.2A2.8 2.8 0 0 1 14 8.3V19a2.2 2.2 0 0 0-2.2-1.6H5zM19 5.5h-6.2A2.8 2.8 0 0 0 10 8.3V19a2.2 2.2 0 0 1 2.2-1.6H19z" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5 13.4 9 18 10.4 13.4 11.8 12 16.4 10.6 11.8 6 10.4 10.6 9z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

function ConnectIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="15" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5H5.5V8M16 5.5h2.5V8M8 18.5H5.5V16M16 18.5h2.5V16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CinematicHome() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  function closeMenu() {
    setMenu(false);
  }

  return (
    <div className="cine">
      <a className="cine-skip" href="#content">
        Skip to content
      </a>
      <header className={scrolled ? "cine-nav is-scrolled" : "cine-nav"}>
        <div className="cine-nav-inner">
          <a className="cine-brand" href="#about">
            <BrandLockup kind="affigrove" />
          </a>
          <nav className="cine-links" aria-label="Primary">
            {NAV.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <a className="cine-cta cine-nav-cta" href="#contact">
            Partner with us
          </a>
          <button
            type="button"
            className="cine-menu-btn"
            aria-expanded={menu}
            aria-controls={menuId}
            aria-label={menu ? "Close menu" : "Open menu"}
            onClick={() => setMenu((value) => !value)}
          >
            <span className="cine-burger" />
          </button>
        </div>
        <div id={menuId} className={menu ? "cine-drop is-open" : "cine-drop"} inert={menu ? undefined : true} aria-hidden={menu ? undefined : true}>
          <div className="cine-drop-inner">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
            <a href="#contact" onClick={closeMenu}>
              Partner with us
            </a>
          </div>
        </div>
      </header>

      <main id="content">
        <section id="about" className="cine-hero">
          <BackgroundVideo className="cine-video" src="/media/hero.mp4" poster="/media/hero.jpg" priority />
          <div className="cine-shade" />
          <div className="cine-hero-copy">
            <p className="cine-pill">Independent Digital Media Group</p>
            <h1>
              <span>Stories that stay.</span>
              <span>
                Connections that <em className="cine-italic">matter.</em>
              </span>
            </h1>
            <p className="cine-sub">
              We bring storytelling, audience understanding and thoughtful partnerships together to create digital experiences worth engaging with.
            </p>
            <div className="cine-actions">
              <a className="cine-btn" href="#features">
                Explore AffiGrove
              </a>
              <a className="cine-btn-dark" href="#contact">
                Work with us
              </a>
            </div>
          </div>
        </section>

        <section className="cine-marquee-wrap" aria-label="Built around what matters">
          <p className="cine-marquee-label">Built around what matters.</p>
          <div className="cine-marquee">
            <div className="cine-track">
              {[0, 1, 2, 3].map((group) => (
                <div className="cine-group" key={group} aria-hidden={group > 0}>
                  {VALUES.map((value) => (
                    <span className="cine-word" key={`${group}-${value.name}`}>
                      <value.icon />
                      {value.name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="cine-feature">
          <div className="cine-feature-grid">
            <FadeIn className="cine-copy">
              <p className="cine-kicker">✦ Digital Storytelling</p>
              <h2>Content people choose to watch.</h2>
              <p>
                We believe the most meaningful attention is earned. Through thoughtful creative direction and engaging digital experiences, we aim to create content that informs, entertains and stays with people.
              </p>
              <div className="cine-actions">
                <a className="cine-btn-dark" href="#approach">
                  Discover our approach
                </a>
              </div>
            </FadeIn>
            <FadeIn className="cine-visual" delay={140}>
              <div className="cine-stage">
                <BackgroundVideo className="cine-video" src="/media/stories.mp4" poster="/media/stories.jpg" />
                <div className="cine-stage-shade" />
                <div className="cine-float">
                  <div className="cine-chips" aria-hidden="true">
                    <span>Stories</span>
                    <span>Culture</span>
                    <span>Discover</span>
                  </div>
                  <strong>The AffiGrove Edit</strong>
                  <p>Perspectives worth exploring.</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section id="approach" className="cine-feature is-reverse">
          <div className="cine-feature-grid">
            <FadeIn className="cine-visual" delay={80}>
              <div className="cine-stage">
                <BackgroundVideo className="cine-video" src="/media/partnerships.mp4" poster="/media/partnerships.jpg" />
                <div className="cine-stage-shade" />
                <div className="cine-story">
                  <div className="cine-story-top">
                    <span className="cine-mini">AffiGrove Stories</span>
                    <span className="cine-mini" aria-hidden="true">
                      Preview
                    </span>
                  </div>
                  <strong>The Art of Connection</strong>
                  <div className="cine-bars" aria-hidden="true">
                    {[40, 70, 52, 88, 46, 76, 58, 92, 48, 68, 36, 80, 54, 72].map((height, index) => (
                      <i key={index} style={{ height: `${height}%` }} />
                    ))}
                  </div>
                  <p>Every meaningful connection begins with a story.</p>
                  <div className="cine-controls" aria-hidden="true">
                    <span className="cine-play">
                      <i />
                    </span>
                    <span className="cine-line">
                      <i />
                    </span>
                    <span>00:32</span>
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeIn className="cine-copy" delay={160}>
              <p className="cine-kicker">✦ Meaningful Partnerships</p>
              <h2>Where creativity meets opportunity.</h2>
              <p>
                We believe strong partnerships begin with relevance, trust and a shared understanding of audiences. AffiGrove brings a considered approach to digital media, creative opportunities and long-term relationships.
              </p>
              <div className="cine-actions">
                <a className="cine-btn-dark" href="#contact">
                  Let&apos;s collaborate
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

        <section id="faq" className="cine-faq">
          <FadeIn>
            <h2>Good questions. Clear answers.</h2>
          </FadeIn>
          <div className="cine-accordion">
            {QUESTIONS.map((item, index) => {
              const expanded = openFaq === index;
              const panelId = `faq-panel-${index}`;
              return (
                <div className="cine-item" key={item.q}>
                  <h3>
                    <button
                      type="button"
                      className="cine-q"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={() => setOpenFaq(expanded ? null : index)}
                    >
                      {item.q}
                      <span className="cine-plus" aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={panelId} className={expanded ? "cine-a is-open" : "cine-a"} role="region">
                    <div className="cine-a-inner">
                      <p>{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer id="contact" className="cine-footer">
        <BackgroundVideo className="cine-video" src="/media/hero.mp4" poster="/media/hero.jpg" />
        <div className="cine-shade" />
        <div className="cine-footer-copy">
          <h2>
            Let&apos;s create something <em className="cine-italic">meaningful.</em>
          </h2>
          <div className="cine-actions">
            <Link className="cine-btn" href="/site/contact">
              Start a conversation
            </Link>
            <a className="cine-btn-dark" href="#features">
              Explore our approach
            </a>
          </div>
        </div>
        <div className="cine-cols">
          <div>
            <a className="cine-brand" href="#about">
              <BrandLockup kind="affigrove" />
            </a>
            <p>Thoughtful media. Meaningful connections.</p>
          </div>
          <div>
            <h3>Company</h3>
            <a href="#about">About</a>
            <a href="#features">What We Do</a>
            <a href="#approach">Our Approach</a>
            <a href="#contact">Contact</a>
          </div>
          <div>
            <h3>Legal</h3>
            <Link href="/site/privacy">Privacy Policy</Link>
            <Link href="/site/terms">Terms of Service</Link>
          </div>
          <div>
            <h3>Connect</h3>
            <p>Public social profiles have not been published.</p>
          </div>
        </div>
        <div className="cine-legal">
          <span>© 2026 AffiGrove Media Group. All rights reserved.</span>
          <span>AffiGrove Media Group</span>
        </div>
      </footer>
    </div>
  );
}
