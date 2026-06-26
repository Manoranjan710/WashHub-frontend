'use client';
import React, { useEffect, useRef, useState } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';

const hiddenTransform: Record<Direction, string> = {
  up:    'translateY(48px)',
  down:  'translateY(-48px)',
  left:  'translateX(48px)',
  right: 'translateX(-48px)',
};

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

const ScrollReveal = ({
  children,
  direction = 'up',
  delay = 0,
  className = '',
  as: Tag = 'div',
}: ScrollRevealProps) => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0, 0)' : hiddenTransform[direction],
        transition: 'opacity 0.65s ease-out, transform 0.65s ease-out',
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Component>
  );
};

export default ScrollReveal;
