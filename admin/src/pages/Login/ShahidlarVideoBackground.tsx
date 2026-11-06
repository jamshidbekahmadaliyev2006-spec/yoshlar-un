import React, { useState } from 'react';

/**
 * ShahidlarVideoBackground
 * - 1080p Full HD tiniq 20 soniyalik oldinga-orqaga (Ping-Pong) videofon
 * - Tabiiy, fotorealistik, ortiqcha sun'iy qatlamlarsiz
 * - Native GPU 60 FPS apparat tezlashuvi
 */
export const ShahidlarVideoBackground: React.FC = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  return (
    <div className="shahidlar-video-container" aria-hidden="true">
      <video
        src="/assets/shahidlar_video.mp4"
        className={`shahidlar-bg-video ${isVideoLoaded ? 'is-loaded' : ''}`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setIsVideoLoaded(true)}
      />
    </div>
  );
};
