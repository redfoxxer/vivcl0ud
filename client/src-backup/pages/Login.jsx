import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      onLogin(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>☁️</div>
        <h1 style={styles.title}>viviCL0UD</h1>
        <p style={styles.subtitle}>Your private encrypted storage</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : '🔐 Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
  card: { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '40px 50px', width: 380, textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 4px' },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 30 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, outline: 'none' },
  error: { color: '#ff6b6b', fontSize: 13, margin: 0 },
  button: { padding: '14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }
};
