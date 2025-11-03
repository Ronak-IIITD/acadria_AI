import type { FC } from 'react';

const About: FC = () => {
  return (
    <section id="about" className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
               style={{ 
                 background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.1), rgba(139, 147, 212, 0.1))',
                 border: '1px solid rgba(53, 208, 195, 0.2)'
               }}>
            <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
              About Us
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" 
              style={{ color: 'var(--color-text-primary)' }}>
            Empowering Students with AI
          </h2>
          
          <p className="text-lg sm:text-xl leading-relaxed" 
             style={{ color: 'var(--color-text-secondary)' }}>
            StudySync AI was built to transform how students learn and interact with their study materials. 
            We believe that learning should be intuitive, engaging, and accessible to everyone. 
            By combining cutting-edge AI technology with thoughtful design, we've created a platform 
            that makes studying more efficient and effective.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div 
            className="text-center p-6 rounded-2xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid rgba(53, 208, 195, 0.2)',
              transform: 'translateZ(0)',
              transition: 'all 0.3s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateZ(20px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateZ(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.2), rgba(139, 147, 212, 0.2))' }}>
              <svg className="w-6 h-6" style={{ color: '#35d0c3' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Fast & Efficient
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Get instant answers from your documents without endless searching
            </p>
          </div>

          <div 
            className="text-center p-6 rounded-2xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid rgba(53, 208, 195, 0.2)',
              transform: 'translateZ(0)',
              transition: 'all 0.3s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateZ(20px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateZ(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.2), rgba(139, 147, 212, 0.2))' }}>
              <svg className="w-6 h-6" style={{ color: '#35d0c3' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Privacy First
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Your data stays secure and private, always under your control
            </p>
          </div>

          <div 
            className="text-center p-6 rounded-2xl"
            style={{ 
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid rgba(53, 208, 195, 0.2)',
              transform: 'translateZ(0)',
              transition: 'all 0.3s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateZ(20px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateZ(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, rgba(53, 208, 195, 0.2), rgba(139, 147, 212, 0.2))' }}>
              <svg className="w-6 h-6" style={{ color: '#35d0c3' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Smart Learning
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              AI-powered insights that adapt to your learning style
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
