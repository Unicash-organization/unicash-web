'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export default function FAQPage() {
  const [faqsByCategory, setFaqsByCategory] = useState<Record<string, FAQ[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await api.faqs.getAll();
        const allFaqs = response.data || [];

        // Group FAQs by category
        const grouped: Record<string, FAQ[]> = {};
        allFaqs.forEach((faq: FAQ) => {
          if (!grouped[faq.category]) {
            grouped[faq.category] = [];
          }
          grouped[faq.category].push(faq);
        });

        // Sort FAQs within each category by order
        Object.keys(grouped).forEach((category) => {
          grouped[category].sort((a, b) => a.order - b.order);
        });

        setFaqsByCategory(grouped);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  // Category display names
  const categoryNames: Record<string, string> = {
    general: 'General',
    membership: 'Membership',
    draws: 'Credits & Draws',
    payments: 'Payments',
    winners: 'Prizes & Winners',
    other: 'Other',
  };

  const categoryOrder = ['general', 'membership', 'draws', 'payments', 'winners', 'other'];

  if (loading) {
    return (
      <>
        <section className="gradient-purple text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Find answers to common questions about UniCash, memberships, draws, and prizes.
            </p>
          </div>
        </section>
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
            <p className="mt-4 text-gray-600">Loading FAQs...</p>
          </div>
        </section>
      </>
    );
  }

  const categories = categoryOrder.filter((cat) => faqsByCategory[cat] && faqsByCategory[cat].length > 0);

  return (
    <>
      {/* Hero Section */}
      <section className="gradient-purple text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Find answers to common questions about UniCash, memberships, draws, and prizes.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No FAQs available at the moment.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {categories.map((category, categoryIndex) => (
                <div key={category}>
                  <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center">
                    <span className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-white mr-4">
                      {categoryIndex + 1}
                    </span>
                    {categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                  </h2>
                  <div className="space-y-4">
                    {faqsByCategory[category].map((faq) => (
                      <details key={faq.id} className="card p-6 group">
                        <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center">
                          <span>{faq.question}</span>
                          <svg
                            className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div
                          className="mt-4 text-gray-600 leading-relaxed rich-text-content"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Our support team is here to help!
          </p>
          <div className="flex justify-center space-x-4">
            <button className="btn-primary">
              Contact Support
            </button>
            <button className="btn-secondary">
              View Documentation
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
