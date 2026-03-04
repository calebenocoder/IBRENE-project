import { useEffect } from 'react';
import { Hero } from '../components/Hero';
import { EventsSection } from '../components/EventsSection';
import { ServiceTimes } from '../components/ServiceTimes';
import { Footer } from '../components/Footer';

export const Home = () => {
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <main>
            <Hero />
            <div className="reveal">
                <EventsSection />
            </div>
            <div className="reveal">
                <ServiceTimes />
            </div>
            <Footer />
        </main>
    );
};
