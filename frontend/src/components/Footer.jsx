import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            textAlign: 'center',
            padding: '2rem',
            background: '#151025',
            color: '#666',
            fontSize: '0.9rem'
        }}>
            <p>&copy; {new Date().getFullYear()} BodyQ. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
