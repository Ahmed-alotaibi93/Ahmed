import { BookingFlow } from "@/components/BookingFlow";
import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,560px)] lg:items-start">
      <Hero />
      <BookingFlow />
    </div>
  );
}
