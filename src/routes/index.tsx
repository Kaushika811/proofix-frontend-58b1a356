import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "@/components/landing/LandingPage";
import landingCss from "@/components/landing/landing.css?url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProoFix — Evidence before merge" },
      { name: "description", content: "Reproduce failures, constrain repairs, and challenge AI-generated changes. Inspect the evidence before deciding to merge." },
    ],
    links: [
      { rel: "stylesheet", href: landingCss },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  component: LandingPage,
});
