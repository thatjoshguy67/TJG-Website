'use client';

import Image from 'next/image';
import './NativeSlideshow.css';
import { useEffect, useRef, useState } from 'react';

export interface SlideData {
  src: string;
  alt: string;
  caption?: string;
}

interface NativeSlideshowProps {
  slides: SlideData[];
}

const DRAG_THRESHOLD_PX = 6;

export default function NativeSlideshow({ slides }: NativeSlideshowProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = viewport?.firstElementChild;
    if (!viewport || !track) return;
    const updateEdges = () => {
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      const atStart = viewport.scrollLeft <= 4;
      const atEnd = maxScroll - viewport.scrollLeft <= 4;
      viewport.toggleAttribute('data-overflow-start', !atStart);
      viewport.toggleAttribute('data-overflow-end', !atEnd);

      if (atStart) { setActiveSlide(0); return; }
      if (atEnd) { setActiveSlide(slides.length - 1); return; }
      const anchor = viewport.getBoundingClientRect().left + parseFloat(getComputedStyle(viewport).scrollPaddingLeft);
      let nearest = 0;
      let distance = Infinity;
      Array.from(track.children).forEach((slide, index) => {
        const currentDistance = Math.abs(slide.getBoundingClientRect().left - anchor);
        if (currentDistance < distance) { nearest = index; distance = currentDistance; }
      });
      setActiveSlide(nearest);
    };
    const observer = new ResizeObserver(updateEdges);
    observer.observe(viewport);
    observer.observe(track);
    viewport.addEventListener('scroll', updateEdges, { passive: true });
    updateEdges();
    return () => {
      observer.disconnect();
      viewport.removeEventListener('scroll', updateEdges);
    };
  }, [slides]);

  if (slides.length === 0) return null;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (slides.length <= 1 || event.button !== 0) return;

    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = event.currentTarget.scrollLeft;
    activePointerIdRef.current = event.pointerId;
    didDragRef.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    const distance = event.clientX - dragStartXRef.current;
    if (!didDragRef.current && Math.abs(distance) < DRAG_THRESHOLD_PX) return;

    if (!didDragRef.current) {
      didDragRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    event.currentTarget.scrollLeft = dragStartScrollLeftRef.current - distance;
  };

  const finishDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerIdRef.current = null;
    setIsDragging(false);
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!didDragRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    didDragRef.current = false;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;

    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    viewportRef.current?.scrollBy({
      left: direction * (viewportRef.current.clientWidth * 0.72),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
    event.preventDefault();
  };

  return (
    <div className="native-slideshow">
      <div
        ref={viewportRef}
        className={`native-slideshow__viewport${isDragging ? ' native-slideshow__viewport--dragging' : ''}`}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Image slideshow"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDragging}
        onPointerCancel={finishDragging}
        onClickCapture={handleClickCapture}
        onKeyDown={handleKeyDown}
      >
        <div className="native-slideshow__track">
          {slides.map((slide, index) => (
            <figure
              key={`${slide.src}-${index}`}
              className="native-slideshow__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${slides.length}`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                width={1200}
                height={800}
                draggable={false}
                className="native-slideshow__img"
              />
              {slide.caption && (
                <figcaption className="native-slideshow__caption">
                  {slide.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
      <div className="native-slideshow__indicators" role="group" aria-label={`Image ${Math.min(activeSlide + 1, slides.length)} of ${slides.length}`}>
        <div className="native-slideshow__dots" aria-hidden="true">
          {slides.map((slide, index) => <span
            key={`${slide.src}-${index}`}
            className="native-slideshow__dot"
            data-active={index === activeSlide}
          />)}
        </div>
        <span className="native-slideshow__count" aria-hidden="true">{Math.min(activeSlide + 1, slides.length)} / {slides.length}</span>
      </div>
    </div>
  );
}
