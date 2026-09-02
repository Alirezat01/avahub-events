import { Hero } from "@/components/avahub/hero";
import { ServicesSection } from "@/components/avahub/sections";
import { FeaturedEvents } from "@/components/avahub/featured-events";
import { WhyAvahub } from "@/components/avahub/why-avahub";

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <FeaturedEvents />
      <WhyAvahub />
    </>
  );
}
