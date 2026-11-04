import React, { useState } from 'react';

/**
 * ShahidlarVideoBackground
 * Yunusobod tumani: Shahidlar xotirasi me'moriy ansambli va Toshkent teleminorasi
 * 20 soniyalik apparat tezlashuvli (GPU 60fps) mukammal siklli videofon:
 * - 0s - 10s: Oldinga silliq parvoz
 * - 10s - 20s: Orqaga silliq parvoz
 * - O'ng tomondagi barcha sun'iy intellekt xiraliklari yo'qotilgan va toza oq fonga silliq o'tkazilgan
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
