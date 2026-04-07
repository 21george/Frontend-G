import React from 'react'

export default function Background() {
  return (
<div
      style={{
        position: "absolute",
        inset: 0,
        background: `
        radial-gradient(ellipse 80% 60% at 70% 30%, #1a2fa8 0%, transparent 60%),
        radial-gradient(ellipse 60% 70% at 20% 80%, #1535c0 0%, transparent 55%),
        radial-gradient(ellipse 100% 100% at 50% 50%, #0a1560 0%, #060d3a 100%)
        `,
      }}
      >
          
      {/* Subtle polygon shapes like original */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }}
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        >
        <polygon points="600,0 800,150 750,350 500,300" fill="#3a6aff" />
        <polygon points="0,200 150,100 300,300 100,400" fill="#2255ee" />
        <polygon points="500,400 700,350 800,600 400,600" fill="#1a44cc" />
        <polygon points="200,500 400,450 350,600 150,600" fill="#2050dd" />
      </svg>
      </div>
  )
}
