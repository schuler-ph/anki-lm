import { motion } from "framer-motion";
import { useEffect } from "react";
import useSound from "use-sound";
import jingleSound from "../../assets/jingle2.wav";
import logoImg from "/ankilm-new.svg";

export function BrandingIntro({ onComplete }: { onComplete: () => void }) {
  const [play] = useSound(jingleSound, { volume: 0.5 });

  useEffect(() => {
    play();

    const timer = setTimeout(() => {
      onComplete();
    }, 1500);
    return () => clearTimeout(timer);
  }, [play, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }} // Fade Out des gesamten Overlays
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center">
        {/* BEWEGUNGSMARKE START */}
        <motion.img
          src={logoImg} // Dein Logo Bild
          alt="AnkiLM Logo"
          className="w-32 h-32 mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1.5,
          }}
        />
        {/* BEWEGUNGSMARKE ENDE */}

        <motion.h1
          className="text-3xl font-bold text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          AnkiLM
        </motion.h1>
        <p className="text-gray-500 mt-2">AI Learning Pipeline</p>
      </div>
    </motion.div>
  );
}
