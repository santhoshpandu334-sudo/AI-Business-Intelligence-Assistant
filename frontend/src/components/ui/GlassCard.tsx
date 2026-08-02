import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={`glass-panel rounded-2xl p-6 shadow-glass border border-slate-800/60 text-slate-100 ${className}`}
    >
      {children}
    </motion.div>
  );
};
