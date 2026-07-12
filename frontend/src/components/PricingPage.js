import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const plans = [
  {
    key: 'free',
    nameKey: 'basic',
    price: { monthly: '₹0', yearly: '₹0' },
    period: 'forever',
    popular: false,
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    features: [
      'Up to 30 appointments/month',
      '1 doctor account',
      'Basic queue management',
      'Patient records (up to 100)',
      'Email notifications',
      'WhatsApp reminders',
      'Mobile app access',
    ],
    cta: 'Get Started Free',
    ctaStyle: { background: 'transparent', border: '2px solid #0ea5e9', color: '#0ea5e9' },
  },
  {
    key: 'pro',
    nameKey: 'pro',
    price: { monthly: '₹999', yearly: '₹799' },
    period: '/month',
    popular: true,
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
    features: [
      'Unlimited appointments',
      'Up to 5 doctor accounts',
      'Smart queue management',
      'Unlimited patient records',
      'Video consultations',
      'EMR & prescriptions',
      'Lab report management',
      'Analytics dashboard',
      'Priority support',
      'Custom clinic branding',
    ],
    cta: 'Start Free Trial',
    ctaStyle: { background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)', border: 'none', color: '#fff' },
  },
  {
    key: 'enterprise',
    nameKey: 'enterprise',
    price: { monthly: '₹2,499', yearly: '₹1,999' },
    period: '/month',
    popular: false,
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
    features: [
      'Everything in Pro',
      'Unlimited doctor accounts',
      'Multi-branch management',
      'IPD / bed management',
      'Insurance & TPA integration',
      'NABH compliance tools',
      'Advanced analytics & reports',
      'API access',
      'Dedicated account manager',
      'On-site training',
      'SLA guarantee (99.9% uptime)',
    ],
    cta: 'Contact Sales',
    ctaStyle: { background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)', border: 'none', color: '#fff' },
  },
];

const faqs = [
  { q: 'Is there a free trial?', a: 'Yes — the Pro plan includes a 14-day free trial. No credit card required.' },
  { q: 'Can I switch plans later?', a: 'Absolutely. You can upgrade or downgrade at any time from your clinic dashboard.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI, credit/debit cards, net banking, and wallets via Razorpay.' },
  { q: 'Is my data safe?', a: 'Yes. All data is encrypted with AES-256 and stored in HIPAA-compliant infrastructure.' },
  { q: 'Do you offer discounts for NGOs or government clinics?', a: 'Yes — contact us at support@healthsyncpro.in for special pricing.' },
];

export default function PricingPage({ onNavigate = () => {} }) {
  const { t } = useLanguage();
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>

      {/* Back button */}
      <div style={{ padding: '20px 24px 0' }}>
        <button
          onClick={() => onNavigate('landing')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0',
            borderRadius: '10px', fontSize: '14px', fontWeight: '500',
            color: '#64748b', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#0ea5e9'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <i className="fas fa-arrow-left" style={{ fontSize: '12px' }}></i>
          Back to Home
        </button>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '60px 24px 40px' }}>
        <span style={{
          display: 'inline-block', padding: '6px 16px',
          background: 'rgba(14, 165, 233,0.1)', color: '#0ea5e9',
          borderRadius: '999px', fontSize: '13px', fontWeight: '600',
          marginBottom: '16px', letterSpacing: '0.05em',
        }}>
          PRICING
        </span>
        <h1 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800',
          color: '#0f172a', margin: '0 0 16px', lineHeight: 1.2,
        }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '520px', margin: '0 auto 32px' }}>
          Choose the plan that fits your clinic. All plans include a 14-day free trial.
        </p>

        {/* Billing toggle */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0',
          background: '#e2e8f0', borderRadius: '12px', padding: '4px',
        }}>
          {['monthly', 'yearly'].map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.2s',
                background: billing === b ? '#0ea5e9' : 'transparent',
                color: billing === b ? '#fff' : '#64748b',
              }}
            >
              {b === 'monthly' ? 'Monthly' : 'Yearly'}
              {b === 'yearly' && (
                <span style={{
                  marginLeft: '6px', fontSize: '11px', fontWeight: '700',
                  background: '#22c55e', color: '#fff',
                  padding: '2px 6px', borderRadius: '4px',
                }}>
                  -20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 24px 80px',
      }}>
        {plans.map(plan => (
          <div
            key={plan.key}
            style={{
              background: '#fff',
              borderRadius: '24px',
              border: plan.popular ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
              padding: '32px',
              position: 'relative',
              boxShadow: plan.popular
                ? '0 20px 60px rgba(14, 165, 233,0.15)'
                : '0 4px 20px rgba(0,0,0,0.05)',
              transform: plan.popular ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 20px 60px rgba(14, 165, 233,0.2)'; }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = plan.popular
                ? '0 20px 60px rgba(14, 165, 233,0.15)'
                : '0 4px 20px rgba(0,0,0,0.05)';
            }}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div style={{
                position: 'absolute', top: '-14px', left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                color: '#fff', fontSize: '11px', fontWeight: '700',
                padding: '4px 16px', borderRadius: '999px',
                letterSpacing: '0.08em', whiteSpace: 'nowrap',
              }}>
                MOST POPULAR
              </div>
            )}

            {/* Plan icon */}
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: plan.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <i className={`fas fa-${plan.key === 'free' ? 'seedling' : plan.key === 'pro' ? 'rocket' : 'building-columns'}`}
                style={{ color: '#fff', fontSize: '20px' }}></i>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>
              {t(plan.nameKey)}
            </h3>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '16px 0 8px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>
                {plan.price[billing]}
              </span>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                {plan.period === 'forever' ? ' forever' : billing === 'yearly' ? '/month, billed yearly' : '/month'}
              </span>
            </div>

            {billing === 'yearly' && plan.key !== 'free' && (
              <p style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600', margin: '0 0 20px' }}>
                Save 20% with yearly billing
              </p>
            )}

            <button
              onClick={() => onNavigate(plan.key === 'enterprise' ? 'contact-us' : 'register')}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.2s', marginBottom: '24px',
                ...plan.ctaStyle,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {plan.cta}
            </button>

            {/* Features */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#475569' }}>
                  <i className="fas fa-check-circle" style={{ color: plan.color, fontSize: '15px', marginTop: '1px', flexShrink: 0 }}></i>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '40px' }}>
          Frequently asked questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                background: '#fff', borderRadius: '14px',
                border: '1px solid #e2e8f0', overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '18px 20px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '15px', fontWeight: '600', color: '#0f172a',
                  textAlign: 'left',
                }}
              >
                {faq.q}
                <i className={`fas fa-chevron-${openFaq === i ? 'up' : 'down'}`}
                  style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0, marginLeft: '12px' }}></i>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 20px 18px', fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
        padding: '60px 24px', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', margin: '0 0 12px' }}>
          Ready to modernise your clinic?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', margin: '0 0 32px' }}>
          Join clinics across India using HealthSync to manage appointments and patients.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('register')}
            style={{
              padding: '14px 32px', background: '#fff', color: '#0ea5e9',
              border: 'none', borderRadius: '12px', fontSize: '15px',
              fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Start Free Trial
          </button>
          <button
            onClick={() => onNavigate('contact-us')}
            style={{
              padding: '14px 32px', background: 'transparent',
              color: '#fff', border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: '12px', fontSize: '15px', fontWeight: '700',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
          >
            Talk to Sales
          </button>
        </div>
      </div>
    </div>
  );
}
