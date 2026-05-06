'use client';

import React, { useEffect, useRef, useState } from 'react';

/* ScrollReveal — IntersectionObserver-driven fade-up wrapper.
   Supports polymorphic `as` so it can render as a span/h2/p without
   producing invalid HTML when nested inside another semantic element.
   Defaults to <div> for backward compatibility with existing callers. */

type ElementProps = React.HTMLAttributes<HTMLElement>;

type AsTag =
  | 'div' | 'span' | 'section' | 'article' | 'header' | 'footer' | 'main' | 'aside'
  | 'p' | 'ul' | 'ol' | 'li'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

interface ScrollRevealProps extends ElementProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: AsTag;
}

export default function ScrollReveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
  ...rest
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [delay]);

  const Tag = as as keyof JSX.IntrinsicElements;

  return React.createElement(
    Tag,
    {
      ref,
      className: `transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`,
      ...rest,
    },
    children
  );
}
