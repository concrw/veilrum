import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const Logo: React.FC<LogoProps> = ({ size = 48, className = "" }) => {
  return (
    <img
      src="/lovable-uploads/d43fbf8a-86fd-4a31-a94c-67dd25db1dc9.png"
      width={size}
      style={{ height: 'auto' }}
      alt="RESEARCH WHY 로고"
      className={className}
      loading="eager"
      decoding="async"
    />
  );
};

export default Logo;
