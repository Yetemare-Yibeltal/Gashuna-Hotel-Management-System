import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import RoomsPreview from '../components/home/RoomsPreview';
import Cuisine from '../components/home/Cuisine';
import Testimonials from '../components/home/Testimonials';
import Location from '../components/home/Location';

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <Hero />
      <Features />
      <RoomsPreview />
      <Cuisine />
      <Testimonials />
      <Location />
    </div>
  );
}
