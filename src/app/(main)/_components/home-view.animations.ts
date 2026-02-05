import type { Variants } from "motion/react";

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    height: 0,
    transition: { duration: 0.4, ease: "easeInOut" },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export const messageVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};

export const toolbarVariants: Variants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    marginTop: 8,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

export const buttonHoverVariants: Variants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};
