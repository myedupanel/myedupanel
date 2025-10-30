import React from 'react';
import Logo from './Logo';

export default function SimpleHeader() {
  return (
    <header>
      <nav className="nav-centered"> {/* <-- Updated class name */}
        <a href="/" className="navbar-brand">
          <Logo />
          <span>My EduPanel</span>
        </a>
      </nav>
    </header>
  );
}