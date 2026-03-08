import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, MessageSquareText, ScanLine } from 'lucide-react';

const icons = {
    workout: Dumbbell,
    ai: MessageSquareText,
    food: ScanLine
};

const FeatureCard = ({ title, description, iconKey, delay }) => {
    const Icon = icons[iconKey];
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
            style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                padding: '2rem',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'left',
                cursor: 'default'
            }}
        >
            <div style={{
                background: 'var(--color-primary)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                color: 'white'
            }}>
                <Icon size={24} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'white' }}>{title}</h3>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>{description}</p>
        </motion.div>
    );
};

const Features = () => {
    return (
        <section id="features" style={{ padding: '5rem 5%', background: 'var(--color-background)' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    Science-Backed <span style={{ color: 'var(--color-accent-lime)' }}>Performance</span>
                </h2>
                <p style={{ color: '#aaa', maxWidth: '600px', margin: '0 auto' }}>
                    Advanced tools designed to optimize every aspect of your fitness journey.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
            }}>
                <FeatureCard
                    iconKey="workout"
                    title="Tailored Workouts"
                    description="Adaptive routines that evolve with your progress. Whether you're a beginner or a pro, get the perfect challenge every time."
                    delay={0.1}
                />
                <FeatureCard
                    iconKey="ai"
                    title="AI Coach Assistant"
                    description="Get real-time feedback on your form and answers to your fitness questions 24/7 from our intelligent training bot."
                    delay={0.2}
                />
                <FeatureCard
                    iconKey="food"
                    title="Smart Food Scanning"
                    description="Instantly track calories and protein by simply scanning your meal. Nutrition tracking has never been easier."
                    delay={0.3}
                />
            </div>
        </section>
    );
};

export default Features;
