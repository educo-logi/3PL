import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{
        fontSize: '6rem',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.5rem',
        lineHeight: '1'
      }}>
        404
      </h1>
      <h2 style={{
        fontSize: '1.5rem',
        color: '#374151',
        marginBottom: '1rem'
      }}>
        페이지를 찾을 수 없습니다
      </h2>
      <p style={{
        color: '#6b7280',
        marginBottom: '2rem',
        maxWidth: '400px'
      }}>
        요청하신 페이지가 존재하지 않거나, 주소가 변경되었을 수 있습니다.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '1rem',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(102, 126, 234, 0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(102, 126, 234, 0.3)';
        }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
};

export default NotFound;
