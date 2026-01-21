"use client";

export function MascotSlideshow() {
  return (
    <div className="relative w-64 h-64 mx-auto mb-6">
      <video
        src="https://cup.perkgames.xyz/videos/perkito-run.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-contain rounded-2xl"
      />
      
      {/* Glow effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-3xl scale-75" />
    </div>
  );
}
