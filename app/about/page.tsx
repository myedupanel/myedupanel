import React from 'react';

export default function AboutPage() {
  return (
    <div className="responsive-container" style={{ padding: '5rem 2rem', minHeight: '80vh', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 className="responsive-text text-3xl">About My EduPanel</h1>
      <p className="responsive-text text-base" style={{ marginTop: '1rem', color: '#555' }}>
        We are dedicated to transforming the future of education through robust and intuitive school management systems.
      </p>
      {/* Yahaan aap apni about us ki poori kahani likh sakte hain */}
    </div>
  );
}