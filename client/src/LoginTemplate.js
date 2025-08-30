import React, { useState } from 'react';

const LoginTemplate = ({ onLogin, onRegister, isLogin, setIsLogin, error, success }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'player',
    club: '',
    playerIDCode: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(formData.username, formData.password);
    } else {
      // Validate Player ID for player registration
      if (formData.role === 'player' && !formData.playerIDCode) {
        // This shouldn't happen due to required attribute, but adding as safety check
        return;
      }
      onRegister(formData.username, formData.password, formData.role, formData.club, formData.playerIDCode);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(34, 40, 49, 0.95) 0%, rgba(57, 62, 70, 0.9) 100%)',
      position: 'relative',
      fontFamily: '"Roboto", "Arial", sans-serif',
      overflowY: 'auto'
    }}>
      
      {/* Header Navigation */}
      <header style={{
        background: 'rgba(57, 62, 70, 0.9)',
        padding: '10px 0',
        position: 'relative',
        zIndex: 1000,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px'
        }}>
          
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{ color: '#FFC107', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Player Radar
            </div>
          </div>

          {/* Auth Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setIsLogin(true)}
              style={{
                background: isLogin ? '#FFC107' : 'transparent',
                color: isLogin ? '#000' : '#FFC107',
                border: '1px solid #FFC107',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s',
                borderRadius: '3px'
              }}
            >
              LOGIN
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                background: !isLogin ? '#FFC107' : 'transparent',
                color: !isLogin ? '#000' : '#FFC107',
                border: '1px solid #FFC107',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s',
                borderRadius: '3px'
              }}
            >
              REGISTER
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div style={{
        position: 'relative',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'visible',
        paddingTop: '20px',
        paddingBottom: '20px'
      }}>
        
        {/* Background Player Image */}
        <div style={{
          position: 'absolute',
          right: '0',
          top: '0',
          width: '50%',
          height: '100%',
          backgroundImage: 'url("/santi-cazorla.jpg")',
          backgroundSize: 'contain',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8,
          zIndex: 1,
          '@media (max-width: 768px)': {
            display: 'none'
          }
        }}></div>

        {/* Content Container */}
        <div style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '20px',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'flex-start',
          minHeight: '100%',
          flexWrap: 'wrap'
        }}>
          
          {/* Left Content */}
          <div style={{ 
            flex: '1', 
            maxWidth: '500px',
            paddingTop: '20px'
          }}>
            
            {/* Large Typography */}
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{
                fontSize: 'clamp(48px, 8vw, 80px)',
                fontWeight: '900',
                color: '#FFC107',
                margin: '0',
                lineHeight: '1',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
              }}>
                {isLogin ? 'WELCOME' : 'JOIN'}
              </h1>
              <h2 style={{
                fontSize: 'clamp(48px, 8vw, 80px)',
                fontWeight: '900',
                color: '#fff',
                margin: '0',
                lineHeight: '1',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
              }}>
                {isLogin ? 'BACK' : 'THE TEAM'}
              </h2>
            </div>

            {/* Date Info */}
            <div style={{
              color: '#fff',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '30px',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              FROM AUGUST 2025
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '30px',
              borderRadius: '0',
              maxWidth: '380px',
              border: '3px solid #FFC107',
              marginBottom: '40px'
            }}>
              
              <h3 style={{
                color: '#FFC107',
                fontSize: '20px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginBottom: '25px',
                textAlign: 'center',
                letterSpacing: '2px'
              }}>
                {isLogin ? 'SIGN IN' : 'REGISTER'}
              </h3>

              {/* Error Message */}
              {error && (
                <div style={{
                  background: 'rgba(220, 20, 60, 0.9)',
                  color: '#fff',
                  padding: '15px',
                  marginBottom: '20px',
                  border: '2px solid #DC143C',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  lineHeight: '1.4'
                }}>
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div style={{
                  background: 'rgba(34, 139, 34, 0.9)',
                  color: '#fff',
                  padding: '15px',
                  marginBottom: '20px',
                  border: '2px solid #228B22',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  lineHeight: '1.4'
                }}>
                  {success}
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="USERNAME"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 193, 7, 0.5)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FFC107'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 193, 7, 0.5)'}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="PASSWORD"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 193, 7, 0.5)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FFC107'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 193, 7, 0.5)'}
                />
              </div>

              {!isLogin && (
                <div style={{ marginBottom: '15px' }}>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 193, 7, 0.5)',
                      color: '#fff',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="player" style={{ background: '#333', color: '#fff' }}>PLAYER</option>
                    <option value="scout" style={{ background: '#333', color: '#fff' }}>SCOUT</option>
                  </select>
                </div>
              )}

              {!isLogin && (
                <div style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    name="club"
                    placeholder="ENTER CLUB NAME"
                    value={formData.club}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 193, 7, 0.5)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {!isLogin && formData.role === 'player' && (
                <div style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    name="playerIDCode"
                    placeholder="PLAYER ID (REQUIRED)"
                    value={formData.playerIDCode}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 193, 7, 0.5)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{
                    color: '#FFC107',
                    fontSize: '11px',
                    marginTop: '5px',
                    fontStyle: 'italic',
                    lineHeight: '1.3'
                  }}>
                    Enter your Player ID given by your scout to link your account.<br/>
                    Contact your scout if you don't have a Player ID.
                  </div>
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#FFC107',
                  color: '#000',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  letterSpacing: '2px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#FFD54F';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#FFC107';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {isLogin ? 'SIGN IN' : 'REGISTER'}
              </button>

              {/* Switch between Login/Register */}
              <div style={{ 
                textAlign: 'center', 
                marginTop: '20px',
                color: '#fff',
                fontSize: '14px'
              }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFC107',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {isLogin ? 'Register here' : 'Login here'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginTemplate;
