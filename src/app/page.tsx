import { Hero } from "@/components/avahub/hero";
import {
  ServicesSection,
  EventsSection,
  CtaBanner,
} from "@/components/avahub/sections";

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <EventsSection />
      <CtaBanner />
    </>
  );
}
