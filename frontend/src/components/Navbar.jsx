import React from 'react';
import { Download } from 'lucide-react';

const Navbar = () => {
    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 5%',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(36, 28, 64, 0.8)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent-lime)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                BodyQ
            </div>

            {/* Desktop Menu */}
            <div style={{ gap: '2rem', display: 'none' }} className="desktop-menu">
                <a href="#features" style={{ color: 'white', fontWeight: 500 }}>Features</a>
                <a href="#preview" style={{ color: 'white', fontWeight: 500 }}>App View</a>
                <a href="#" style={{ color: 'white', fontWeight: 500 }}>Testimonials</a>
            </div>

            <button style={{
                backgroundColor: 'var(--color-accent-lime)',
                color: 'var(--color-background)',
                padding: '0.8rem 1.5rem',
                borderRadius: '50px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'transform 0.2s ease'
            }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <Download size={18} />
                Install App
            </button>

            <style>{`
        @media (min-width: 768px) {
          .desktop-menu { display: flex !important; }
        }
      `}</style>
        </nav>
    );
};

export default Navbar;
