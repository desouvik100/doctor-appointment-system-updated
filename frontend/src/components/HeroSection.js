// HeroSection.js — Beautiful animated hero using Framer Motion
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

/* ─── tiny animated counter ─── */
function Counter({ to, suffix = '' }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v) + suffix);
  const [display, setDisplay] = useState('0' + suffix);

  useEffect(() => {
    const controls = animate(count, to, { duration: 2, ease: 'easeOut' });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [to, suffix, count, rounded]);

  return <span>{display}</span>;
}

/* ─── floating badge card ─── */
function FloatingCard({ children, style, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { delay, duration: 0.5 },
        scale: { delay, duration: 0.5, type: 'spring', stiffness: 200 },
        y: {
          delay: delay + 0.6,
          duration: 3.5 + delay * 0.4,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.5, 1],
        },
      }}
      style={{
        position: 'absolute',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '12px 16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        border: '1px solid rgba(255,255,255,0.8)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 10,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── icon box ─── */
function IconBox({ gradient, icon, size = 36 }) {
  return (
    <div style={{
      width: size, height: size,
      background: gradient,
      borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <i className={`fas ${icon}`} style={{ color: '#fff', fontSize: size * 0.4 }}></i>
    </div>
  );
}

/* ─── live pulse dot ─── */
function PulseDot({ color = '#22c55e' }) {
  return (
    <motion.div
      style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }}
      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ─── quick search bar ─── */
function QuickSearchBar({ onNavigate }) {
  const [specialty, setSpecialty] = useState('');
  const specialties = ['General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Orthopedic', 'Gynecologist', 'Neurologist', 'Dentist'];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '8px 8px 8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
        maxWidth: '520px',
        marginBottom: '40px',
      }}
    >
      <i className="fas fa-search" style={{ color: '#94a3b8', fontSize: '15px', flexShrink: 0 }}></i>
      <select
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        style={{
          flex: 1, border: 'none', outline: 'none',
          fontSize: '14px', color: specialty ? '#0f172a' : '#94a3b8',
          background: 'transparent', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: '500',
          appearance: 'none', WebkitAppearance: 'none',
        }}
      >
        <option value="" disabled>Search by specialty…</option>
        {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <motion.button
        onClick={() => onNavigate('register')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#fff', border: 'none', borderRadius: '10px',
          fontSize: '14px', fontWeight: '700', cursor: 'pointer',
          flexShrink: 0, whiteSpace: 'nowrap',
          boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
        }}
      >
        Book Now
      </motion.button>
    </motion.div>
  );
}


export default function HeroSection({ onNavigate = () => {}, darkMode = false }) {
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  const intervalRef = useRef(null);

  const taglines = [
    'Clinic Appointments\nMade Simple',
    'Book Doctor Online.\nSkip the Queue.',
    'Smart Queue Management\nfor Clinics',
    'Zero Wait.\nReal-Time Queue Updates.',
  ];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setExiting(true);
      setTimeout(() => {
        setTaglineIdx((p) => (p + 1) % taglines.length);
        setExiting(false);
      }, 400);
    }, 3800);
    return () => clearInterval(intervalRef.current);
  }, [taglines.length]);

  /* ── gradient orbs ── */
  const orbs = [
    { w: 600, h: 600, top: '-200px', left: '-150px', color: 'rgba(99,102,241,0.35)' },
    { w: 500, h: 500, top: '30%', right: '-100px', color: 'rgba(20,184,166,0.3)' },
    { w: 400, h: 400, bottom: '-100px', left: '30%', color: 'rgba(249,115,22,0.2)' },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      id="home"
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f2027 100%)',
      }}
    >
      {/* ── animated gradient orbs ── */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: orb.w, height: orb.h,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            top: orb.top, left: orb.left, right: orb.right, bottom: orb.bottom,
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
        />
      ))}

      {/* ── subtle grid overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* ── main content ── */}
      <div style={{
        maxWidth: '1280px', margin: '0 auto',
        padding: '120px 40px 80px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '80px',
        alignItems: 'center',
        width: '100%',
        position: 'relative', zIndex: 1,
      }}
        className="hero-grid-responsive"
      >
        {/* ── LEFT: text content ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* badge */}
          <motion.div variants={itemVariants}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px',
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '999px',
              marginBottom: '28px',
            }}>
              <PulseDot color="#22c55e" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>
                India's #1 Clinic Appointment Platform
              </span>
            </div>
          </motion.div>

          {/* rotating headline */}
          <motion.div variants={itemVariants} style={{ minHeight: '160px', marginBottom: '24px', overflow: 'hidden' }}>
            <motion.h1
              key={taglineIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: exiting ? 0 : 1, y: exiting ? -20 : 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)',
                fontWeight: '800',
                lineHeight: 1.15,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {taglines[taglineIdx].split('\n').map((line, i) => (
                <span key={i}>
                  {i === 1
                    ? <span style={{ background: 'linear-gradient(90deg, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{line}</span>
                    : line}
                  {i === 0 && <br />}
                </span>
              ))}
            </motion.h1>
          </motion.div>

          {/* subtitle */}
          <motion.p variants={itemVariants} style={{
            fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.75, marginBottom: '36px', maxWidth: '520px',
          }}>
            Book doctor appointments online in 30 seconds. Real-time queue tracking.
            Video consultations from home.{' '}
            <strong style={{ color: '#ffffff', fontWeight: '600' }}>No more waiting in long queues.</strong>
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={itemVariants} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
            <motion.button
              onClick={() => onNavigate('register')}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
                display: 'flex', alignItems: 'center', gap: '8px',
                letterSpacing: '0.01em',
              }}
            >
              Get Started Free
              <i className="fas fa-arrow-right" style={{ fontSize: '13px' }}></i>
            </motion.button>

            <motion.button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '14px 28px',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <i className="fas fa-play-circle" style={{ fontSize: '14px', color: '#818cf8' }}></i>
              See How It Works
            </motion.button>
          </motion.div>

          {/* Quick search bar */}
          <motion.div variants={itemVariants}>
            <QuickSearchBar onNavigate={onNavigate} />
          </motion.div>

          {/* stats row */}
          <motion.div variants={itemVariants} style={{
            display: 'flex', gap: '40px', flexWrap: 'wrap',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            {[
              { value: 500, suffix: '+', label: 'Verified Doctors' },
              { value: 50, suffix: 'K+', label: 'Happy Patients' },
              { value: 99, suffix: '.9%', label: 'Uptime' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#ffffff', lineHeight: 1 }}>
                  <Counter to={stat.value} suffix={stat.suffix} />
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontWeight: '500' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* trust logos */}
          <motion.div variants={itemVariants} style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            marginTop: '32px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>Trusted by:</span>
            {['Apollo', 'Fortis', 'Max', 'AIIMS'].map((name) => (
              <div key={name} style={{
                padding: '5px 14px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                fontSize: '12px', fontWeight: '600',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.03em',
              }}>{name}</div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT: visual ── */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', height: '560px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="hero-visual-responsive"
        >
          {/* glow behind image */}
          <motion.div
            style={{
              position: 'absolute', width: '340px', height: '340px',
              background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
              borderRadius: '50%', filter: 'blur(40px)',
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* doctor image card */}
          <motion.div
            style={{
              position: 'relative',
              width: '300px', height: '400px',
              borderRadius: '28px', overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=800&fit=crop&crop=face"
              alt="Medical Team"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            />
            {/* bottom overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px',
              background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, transparent 100%)',
              padding: '20px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Our Medical Team</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', marginBottom: '8px' }}>Expert Healthcare Professionals</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[1,2,3,4,5].map(i => (
                  <i key={i} className="fas fa-star" style={{ color: '#fbbf24', fontSize: '11px' }}></i>
                ))}
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginLeft: '6px' }}>4.9 (200+ reviews)</span>
              </div>
            </div>
          </motion.div>

          {/* ── floating cards ── */}

          {/* Online Now — top left */}
          <FloatingCard delay={0.6} style={{ top: '40px', left: '-20px' }}>
            <PulseDot color="#22c55e" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Online Now</span>
          </FloatingCard>

          {/* Verified — top right */}
          <FloatingCard delay={0.8} style={{ top: '20px', right: '-10px' }}>
            <IconBox gradient="linear-gradient(135deg,#22c55e,#10b981)" icon="fa-check" size={36} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>Verified</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Licensed Doctor</div>
            </div>
          </FloatingCard>

          {/* Video Consult — bottom left */}
          <FloatingCard delay={1.0} style={{ bottom: '80px', left: '-30px' }}>
            <IconBox gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" icon="fa-video" size={36} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>Video Consult</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Available Now</div>
            </div>
          </FloatingCard>

          {/* Live Queue — bottom right */}
          <FloatingCard delay={1.2} style={{ bottom: '160px', right: '-20px' }}>
            <div style={{ position: 'relative' }}>
              <IconBox gradient="linear-gradient(135deg,#f59e0b,#d97706)" icon="fa-users" size={36} />
              <motion.div
                style={{
                  position: 'absolute', top: -3, right: -3,
                  width: 12, height: 12, borderRadius: '50%',
                  background: '#22c55e', border: '2px solid #fff',
                }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>Live Queue</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>3 patients ahead</div>
            </div>
          </FloatingCard>

          {/* Appointment booked — mini toast bottom center */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.6, duration: 0.5, type: 'spring' }}
            style={{
              position: 'absolute', bottom: '10px',
              left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(15,23,42,0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px', padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: '10px',
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <motion.div
              style={{
                width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
              }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Appointment confirmed</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>just now</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ── bottom wave ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, pointerEvents: 'none' }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: '80px', display: 'block' }}>
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8fafc" />
        </svg>
      </div>

      {/* ── responsive styles ── */}
      <style>{`
        @media (max-width: 1024px) {
          .hero-grid-responsive {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding: 100px 24px 60px !important;
          }
          .hero-visual-responsive {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .hero-grid-responsive {
            padding: 90px 20px 50px !important;
          }
        }
      `}</style>
    </section>
  );
}
