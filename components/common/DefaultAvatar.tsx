import React from 'react';
import styles from './DefaultAvatar.module.scss';

// --- ADDED: Define props the component accepts ---
interface DefaultAvatarProps {
  name?: string; // Make name optional
  size?: number; // Make size optional
}

// --- ADDED: Helper to get initials ---
const getInitials = (name: string | undefined): string => {
  if (!name) return '';
  const names = name.split(' ');
  const firstInitial = names[0]?.[0] || '';
  const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] : '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

// --- UPDATED: Use props ---
const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ name, size = 100 }) => { // Default size is 100 if not provided
  const initials = getInitials(name);

  // --- ADDED: Style object for dynamic size ---
  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size * 0.4}px`, // Adjust font size based on avatar size
  };

  return (
    // --- UPDATED: Apply dynamic style and conditional rendering ---
    <div className={styles.avatarContainer} style={avatarStyle}>
      {initials ? (
        // If initials exist, show them
        <span className={styles.initials}>{initials}</span>
      ) : (
        // Otherwise, show the default SVG icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={styles.avatarIcon}
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </div>
  );
};

export default DefaultAvatar;