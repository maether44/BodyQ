import React from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Flame, Apple, Dumbbell } from 'lucide-react';

const DashboardPreview = () => {
    return (
        <section id="preview" style={{
            padding: '5rem 5%',
            background: 'linear-gradient(to bottom, var(--color-background), #1a142e)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4rem'
            }}>
                <div style={{ flex: '1 1 400px', maxWidth: '600px' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
                        Your Gym <br />
                        <span style={{ color: 'var(--color-accent-light)' }}>In Your Pocket</span>
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: '#ccc', marginBottom: '2rem' }}>
                        Experience the ultimate fitness companion. From tracking your daily macros to analyzing your lifting tempo, BodyQ handles the data so you can handle the weights.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        {/* App Store Badges (Simulated) */}
                        <button style={{
                            background: '#000',
                            border: '1px solid #333',
                            borderRadius: '10px',
                            padding: '0.8rem 1.5rem',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <Apple size={24} fill="white" />
                            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                                <div style={{ fontSize: '0.7rem' }}>Download on the</div>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>App Store</div>
                            </div>
                        </button>
                        <button style={{
                            background: '#000',
                            border: '1px solid #333',
                            borderRadius: '10px',
                            padding: '0.8rem 1.5rem',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <Play size={24} fill="white" />
                            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                                <div style={{ fontSize: '0.7rem' }}>GET IT ON</div>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>Google Play</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Phone Mockup */}
                <motion.div
  initial={{ opacity: 0, x: 50 }}
  whileInView={{ opacity: 1, x: 0 }}
  whileHover={{
    scale: 1.06,
    boxShadow: `
      0 0 40px rgba(187, 110, 231, 0.25),
      0 0 80px rgba(134, 59, 246, 0.25),
      0 25px 50px -12px rgba(0, 0, 0, 0.6)
    `
  }}
  transition={{
    duration: 0.4,
    ease: 'easeOut'
  }}
  style={{
    width: '320px',
    height: '640px',
    background: '#000',
    borderRadius: '40px',
    border: '8px solid #333',
    position: 'relative',
    overflow: 'hidden'
  }}
>

                    {/* Status Bar */}
                    <div style={{ height: '30px', background: '#000', width: '100%', position: 'absolute', top: 0, zIndex: 10 }}></div>

                    {/* App Content */}
                    <div style={{ padding: '40px 20px 20px', height: '100%', background: '#1c1c1e', color: 'white', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Good Morning</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Mortadha</div>
                            </div>
                            <div
  style={{
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6ee7b7, #caf63b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#000'
  }}
>
  M
</div>
                        </div>

                        {/* Daily Stats */}
                        <div style={{ background: '#2c2c2e', padding: '15px', borderRadius: '20px', display: 'flex', justifyContent: 'space-around' }}>
                            <div style={{ textAlign: 'center' }}>
                                <Flame size={20} color="var(--color-accent-lime)" style={{ margin: '0 auto 5px' }} />
                                <div style={{ fontWeight: 'bold' }}>420</div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>Kcal</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <TrendingUp size={20} color="var(--color-accent-light)" style={{ margin: '0 auto 5px' }} />
                                <div style={{ fontWeight: 'bold' }}>1.2h</div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>Time</div>
                            </div>
                        </div>

                        {/* AI Chat Snippet */}
                        <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-light))', padding: '20px', borderRadius: '20px', color: 'white' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '1.1rem' }}>AI Coach</div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '10px 10px 10px 0', fontSize: '0.9rem', marginBottom: '10px' }}>
                                Your form on the last set was perfect! Increase weight by 2.5kg?
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <div style={{ background: 'white', color: 'var(--color-primary)', padding: '5px 15px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>Yes</div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '5px 15px', borderRadius: '15px', fontSize: '0.8rem' }}>Not yet</div>
                            </div>
                        </div>

                        {/* Today's Workout */}
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Today&apos;s Plan</div>
                            <div style={{ background: '#2c2c2e', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div
  style={{
    width: '50px',
    height: '50px',
    background: '#444',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
>
  <Dumbbell size={24} color="var(--color-accent-lime)" />
</div>

                                <div>
                                    <div style={{ fontWeight: 600 }}>Upper Body Power</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>45 mins • Intermediate</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Nav */}
                    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '70px', background: '#000', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <div style={{ width: '24px', height: '24px', background: '#555', borderRadius: '4px' }}></div>
                        <div style={{ width: '24px', height: '24px', background: 'var(--color-accent-lime)', borderRadius: '4px' }}></div>
                        <div style={{ width: '24px', height: '24px', background: '#555', borderRadius: '4px' }}></div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default DashboardPreview;
