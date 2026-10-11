import React from 'react';

interface X0LogoProps {
  className?: string;
  size?: number;
}

export const X0Logo: React.FC<X0LogoProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      viewBox="0 0 100 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size * 0.7 } : undefined}
      aria-label="X0 Logo"
    >
      {/* 
        Geometric X0 Logo:
        Based on authentic geometric monogram.
        X with flat terminals on the lower-left, 
        and chamfered octagonal 0 positioned slightly elevated on the right.
      */}
      {/* Left X arm: top-left to bottom-right */}
      <polygon
        points="7,28 20,28 35,47 22,64 9,64 26,45"
        fill="currentColor"
      />
      {/* Right X arm: bottom-left to top-right */}
      <polygon
        points="9,64 22,64 47,31 34,31"
        fill="currentColor"
      />
      {/* Crossing blend & upper right arm of X */}
      <polygon
        points="26,45 37,31 49,31 34,50"
        fill="currentColor"
      />
      {/* Connecting lower right leg */}
      <polygon
        points="25,48 37,64 51,64 34,43"
        fill="currentColor"
      />

      {/* 
        The Chamfered Octagonal '0' (Elevated upper-right block):
        Outer boundary: chamfered 45deg corners.
        Inner cutout: rectangular window matching geometry.
      */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 54 12
           L 78 12
           L 89 23
           L 89 41
           L 78 52
           L 54 52
           L 43 41
           L 43 23
           Z
           M 56 21
           L 76 21
           L 76 43
           L 56 43
           Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default X0Logo;
