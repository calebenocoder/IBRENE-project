import { Hero } from '../components/Hero';
import { EventsSection } from '../components/EventsSection';
import { ServiceTimes } from '../components/ServiceTimes';
import { Footer } from '../components/Footer';

export const Home = () => {
    return (
        <>
            <Hero />
            <EventsSection />
            <ServiceTimes />
            <Footer />
        </>
    );
};
