import { motion } from 'framer-motion';
import { Music, BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const handleLogin = () => {
    // Use environment variable or fallback to production server
    const authUrl = `${process.env.REACT_APP_AUTH_SERVER_URL}/api/login`;
    
    // For GitHub Pages, we need to specify the full redirect URL
    const redirectTo = process.env.FRONTEND_URL;
    const scopes = 'user-read-private user-read-email user-top-read user-read-recently-played playlist-read-private user-follow-read user-read-playback-state user-library-read user-library-modify user-follow-modify';
    
    window.location.href = `${authUrl}?redirectTo=${encodeURIComponent(redirectTo)}&scope=${encodeURIComponent(scopes)}`;
  };

  const features = [
    {
      icon: BarChart3,
      title: 'Track Your Stats',
      description: 'Discover your top tracks, artists, and genres over time'
    },
    {
      icon: TrendingUp,
      title: 'Analyze Your Trends',
      description: 'See how your music taste evolves with detailed insights'
    },
    {
      icon: Music,
      title: 'Explore Your Library',
      description: 'Browse your saved songs, albums, and playlists in one place'
    }
  ];

  return (
    <div className="landing">
      <div className="landing-container">
        <motion.div
          className="landing-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="sparkles-container">
            <Sparkles className="sparkles" size={48} />
          </div>
          
          <h1 className="landing-title">
            Welcome to <span className="gradient-text">Spütify</span>
          </h1>
          
          <p className="landing-subtitle">
            Your personal Spotify analytics dashboard
          </p>
          
          <p className="landing-description">
            Dive deep into your music listening habits and discover insights about your favorite tracks, artists, and genres.
          </p>
          
          <button onClick={handleLogin} className="btn btn-primary landing-cta">
            <Music size={20} />
            Connect with Spotify
          </button>
        </motion.div>

        <motion.div
          className="features-grid"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="feature-icon">
                <feature.icon size={32} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="landing-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="footer-text">
            Powered by the Spotify Web API • Your data stays private
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
