import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { EventModal } from './EventModal';

interface Event {
    id: string;
    title: string;
    description?: string; // from 'subtitle' in DB
    category?: string;
    date: { day: string; month: string; year: string };
    image: string;
    link?: string;
    slug?: string;
    content?: string;
}

export const EventsSection: React.FC = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        fetchEvents();
    }, []);

    // Handle deep linking from URL
    useEffect(() => {
        if (!loading && events.length > 0) {
            const eventSlug = searchParams.get('evento');
            if (eventSlug) {
                const event = events.find(e => e.slug === eventSlug);
                if (event) {
                    setSelectedEvent(event);
                }
            }
        }
    }, [loading, events, searchParams]);

    const handleSelectEvent = (event: Event | null) => {
        setSelectedEvent(event);
        if (event) {
            setSearchParams({ evento: event.slug || '' });
        } else {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('evento');
            setSearchParams(newParams);
        }
    };

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('site_posts')
                .select('*')
                .eq('visible', true)
                .order('event_date', { ascending: true });

            if (error) {
                console.error('Error fetching events:', error);
                return;
            }

            if (data) {
                const formattedEvents = data.map(post => {
                    const dateObj = new Date(post.event_date);
                    const day = dateObj.getUTCDate().toString().padStart(2, '0');
                    const month = dateObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                    const year = dateObj.getUTCFullYear().toString();

                    return {
                        id: post.id,
                        title: post.title,
                        description: post.subtitle,
                        category: post.category,
                        date: { day, month, year },
                        image: post.image_url || '/placeholder-image.jpg',
                        content: post.content,
                        link: '#',
                        slug: post.title.toLowerCase().replace(/ /g, '-')
                    };
                });
                setEvents(formattedEvents);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 320;
            const currentScroll = scrollContainerRef.current.scrollLeft;
            const targetScroll = direction === 'left'
                ? currentScroll - scrollAmount
                : currentScroll + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    if (!loading && events.length === 0) return null;

    return (
        <section className="events-section">
            <div className="container">
                <div className="events-header">
                    <h2 className="section-title-pill">DESTAQUES</h2>
                    <div className="scroll-controls">
                        <button onClick={() => scroll('left')} className="scroll-btn" aria-label="Scroll left">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <button onClick={() => scroll('right')} className="scroll-btn" aria-label="Scroll right">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={`events-scroller ${loading ? 'loading' : 'loaded'}`} ref={scrollContainerRef}>
                    {loading ? (
                        // Skeleton Cards
                        [1, 2, 3].map((n) => (
                            <div key={n} className="event-card skeleton">
                                <div className="skeleton-shimmer"></div>
                                <div className="date-badge-skeleton"></div>
                                <div className="card-content">
                                    <div className="skeleton-line category"></div>
                                    <div className="skeleton-line title"></div>
                                    <div className="skeleton-line desc"></div>
                                    <div className="skeleton-line button"></div>
                                </div>
                            </div>
                        ))
                    ) : events.length === 0 ? (
                        <p className="no-events">Nenhum evento em destaque no momento.</p>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className="event-card fade-in">
                                <div
                                    className="card-bg"
                                    style={{ backgroundImage: `url(${event.image})` }}
                                ></div>
                                <div className="card-overlay"></div>

                                <div className="date-badge">
                                    <span className="day">{event.date.day}</span>
                                    <span className="month">{event.date.month}</span>
                                    <span className="year">{event.date.year}</span>
                                </div>

                                <div className="card-content">
                                    <span className="category">{event.category}</span>
                                    <h3 className="event-title">{event.title}</h3>
                                    <p className="event-desc">{event.description}</p>
                                    <button
                                        onClick={() => handleSelectEvent(event)}
                                        className="btn-read-more"
                                    >
                                        Ler mais &gt;
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={() => handleSelectEvent(null)}
                />
            )}

            <style>{`
                .events-section {
                    padding: 4rem 0;
                    background-color: var(--color-white);
                    position: relative;
                    z-index: 10; 
                }

                .events-header {
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .section-title-pill {
                    background-color: #0f172a;
                    color: white;
                    padding: 0.5rem 2rem;
                    border-radius: 9999px;
                    font-size: 0.875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: inline-block;
                }

                .scroll-controls {
                    display: flex;
                    gap: 0.5rem;
                }

                .scroll-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: white;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .scroll-btn:hover {
                    border-color: var(--color-accent);
                    color: var(--color-accent);
                    background: #f8fafc;
                }

                .events-scroller {
                    display: flex;
                    gap: 1.5rem;
                    overflow-x: auto;
                    padding: 1rem 0 2rem 0; 
                    margin: -1rem 0 -2rem 0;
                    scroll-snap-type: x mandatory;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                }

                .events-scroller::-webkit-scrollbar {
                    height: 8px;
                }
                .events-scroller::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .events-scroller::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }

                .no-events {
                    text-align: center;
                    width: 100%;
                    padding: 2rem;
                    color: #64748b;
                    font-style: italic;
                }

                .event-card {
                    flex: 0 0 300px;
                    height: 420px;
                    position: relative;
                    border-radius: 0.75rem;
                    overflow: hidden;
                    scroll-snap-align: start;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    background: #000;
                }

                .event-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }

                .card-bg {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    background-position: center;
                }

                .card-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(15, 23, 42, 0.1) 100%);
                }

                .date-badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background-color: var(--color-accent);
                    color: white;
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 60px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                    z-index: 10;
                }

                .date-badge .day {
                    font-size: 1.25rem;
                    font-weight: 800;
                    line-height: 1;
                }

                .date-badge .month {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                
                .date-badge .year {
                    font-size: 0.7rem;
                    font-weight: 400;
                    opacity: 0.9;
                    border-top: 1px solid rgba(255,255,255,0.3);
                    width: 100%;
                    text-align: center;
                    padding-top: 2px;
                }

                .card-content {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    padding: 1.5rem;
                    color: white;
                    z-index: 10;
                }

                .category {
                    display: inline-block;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.5rem;
                    opacity: 0.9;
                    font-weight: 600;
                    color: var(--color-accent-light);
                }

                .event-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    line-height: 1.2;
                    margin-bottom: 0.5rem;
                }

                .event-desc {
                    font-size: 0.875rem;
                    opacity: 0.8;
                    margin-bottom: 1.5rem;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .btn-read-more {
                    display: inline-block;
                    padding: 0.5rem 1.25rem;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 9999px;
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 600;
                    transition: all 0.2s;
                    background: transparent;
                    cursor: pointer;
                }

                .btn-read-more:hover {
                    background-color: var(--color-accent);
                    border-color: var(--color-accent);
                }

                /* --- Animations & Skeleton --- */
                
                .fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .event-card.skeleton {
                    background: #f1f5f9;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }

                .skeleton-shimmer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.4),
                        transparent
                    );
                    animation: shimmer 1.5s infinite;
                    z-index: 5;
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .date-badge-skeleton {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 60px;
                    height: 60px;
                    background: #e2e8f0;
                    border-radius: 0.5rem;
                }

                .skeleton-line {
                    background: #e2e8f0;
                    border-radius: 4px;
                    margin-bottom: 0.75rem;
                }

                .skeleton-line.category { width: 40%; height: 12px; }
                .skeleton-line.title { width: 85%; height: 24px; margin-bottom: 1rem; }
                .skeleton-line.desc { width: 70%; height: 14px; }
                .skeleton-line.button { width: 100px; height: 32px; border-radius: 99px; margin-top: 1rem; }

                @media (max-width: 640px) {
                    .event-card {
                        flex: 0 0 260px;
                        height: 380px;
                    }
                }
            `}</style>
        </section>
    );
};
