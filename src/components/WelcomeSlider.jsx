import React, { useEffect, useRef, useState } from 'react';

// Same slides and copy as the mobile app's login screen.
const SLIDES = [
  { image: '/home-sliders/slider_1.webp', alt: 'A student in a lab coat holding a flask', text: ['Are you passionate', 'about Science?'] },
  { image: '/home-sliders/slider_2.webp', alt: 'A student dreaming of a science career', text: ['Dreaming of joining IISER', 'to build a career in Science?'] },
  { image: '/home-sliders/slider_3.webp', alt: 'Students working together', text: ['Lets work together', 'and crack IISER!'] },
];

const INTERVAL_MS = 5000;

/**
 * Welcome slider: cross-fades every 5 seconds, dots jump to a slide, and the
 * rotation pauses while hovering or when the tab is hidden.
 */
export default function WelcomeSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useRef(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (paused || reduceMotion.current) return undefined;
    const id = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, current]);

  useEffect(() => {
    function onVisibility() { setPaused(document.hidden); }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <section
      className="cp-login-hero"
      aria-label="Welcome to Crispr Learning"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="cp-slides">
        {SLIDES.map((slide, i) => (
          <figure key={slide.image} className={`cp-slide ${i === current ? 'is-active' : ''}`}>
            <img src={slide.image} alt={slide.alt} />
            <figcaption>{slide.text[0]}<br />{slide.text[1]}</figcaption>
          </figure>
        ))}
      </div>
      <div className="cp-slide-dots" role="tablist" aria-label="Slides">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            className={`cp-slide-dot ${i === current ? 'is-active' : ''}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </section>
  );
}
