import type { Profile } from "@/types";

/**
 * ── PROFILE DATA ──────────────────────────────────────────────
 * Replace these placeholder values with your own details. The star at the
 * centre of the solar system, the Profile card, the About overlay and the
 * structured data (JSON-LD) all read from this file.
 */
export const profile: Profile = {
  name: "Alex Nova",
  title: "Full Stack Developer",
  tagline: "I build interactive products at the intersection of design and engineering.",
  bio: "Full stack developer with 7+ years shipping web products end to end. I specialise in real-time interfaces, 3D data visualisation and design systems that scale across teams.",
  longBio: [
    "I'm a full stack developer based in Mumbai, building products where thoughtful interface design meets serious engineering. Over the last seven years I've shipped everything from high-traffic commerce platforms to real-time collaboration tools and WebGL-driven data visualisations.",
    "My work sits at the intersection of performance and craft: I care as much about a 60fps render loop and a 90 kB bundle as I do about typography, motion and accessibility. I lead front-end architecture, mentor engineers, and partner closely with designers to turn ambitious concepts into interfaces people actually enjoy using.",
    "Outside of client work I maintain open-source tooling for React Three Fiber, write about rendering pipelines and design systems, and spend an unreasonable amount of time optimising things that were already fast enough.",
  ],
  avatar: "/avatar.svg",
  email: "hello@alexnova.dev",
  location: "Mumbai, India",
  availability: "Open to freelance & full-time roles",
  resumeUrl: "/alex-nova-resume.pdf",
  social: [
    {
      platform: "github",
      label: "GitHub",
      url: "https://github.com/alexnova",
      icon: "github",
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      url: "https://linkedin.com/in/alexnova",
      icon: "linkedin",
    },
    {
      platform: "twitter",
      label: "X / Twitter",
      url: "https://twitter.com/alexnova_dev",
      icon: "twitter",
    },
    {
      platform: "email",
      label: "Email",
      url: "mailto:hello@alexnova.dev",
      icon: "mail",
    },
  ],
};

export default profile;
