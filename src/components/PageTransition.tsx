import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: 'slide' | 'fade' | 'scale' | 'rotate';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  type = 'slide', 
  direction = 'right', 
  duration = 0.4 
}) => {
  const location = useLocation();

  // Define variants based on animation type and direction
  const getVariants = () => {
    switch (type) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          in: { opacity: 1 },
          out: { opacity: 0 }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8 },
          in: { opacity: 1, scale: 1 },
          out: { opacity: 0, scale: 1.2 }
        };
      case 'rotate':
        return {
          initial: { opacity: 0, rotate: direction === 'left' ? -5 : 5, scale: 0.95 },
          in: { opacity: 1, rotate: 0, scale: 1 },
          out: { opacity: 0, rotate: direction === 'left' ? 5 : -5, scale: 0.95 }
        };
      case 'slide':
      default:
        return {
          initial: { 
            opacity: 0, 
            x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0,
            y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0
          },
          in: { 
            opacity: 1, 
            x: 0, 
            y: 0 
          },
          out: { 
            opacity: 0, 
            x: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
            y: direction === 'up' ? -20 : direction === 'down' ? 20 : 0
          }
        };
    }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: duration,
  };

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="in"
      exit="out"
      variants={getVariants()}
      transition={pageTransition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
