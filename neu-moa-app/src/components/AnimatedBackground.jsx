export default function AnimatedBackground() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -999, backgroundColor: '#f4f7fb', overflow: 'hidden', pointerEvents: 'none' }}>
      <style>
        {`
          /* This keeps the solid white walls out of the way */
          body, html, #root, .dashboard-container {
            background-color: transparent !important;
          }
          
          @keyframes float1 {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.95); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes float2 {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-40px, 30px) scale(0.95); }
            66% { transform: translate(30px, -30px) scale(1.05); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes float3 {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(40px, 40px) scale(1.1); }
            100% { transform: translate(0, 0) scale(1); }
          }
        `}
      </style>

      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '45vw', height: '45vw', background: '#0ea5e9', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.15, animation: 'float1 18s ease-in-out infinite' }} />
      
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '55vw', height: '55vw', background: '#1d4ed8', borderRadius: '50%', filter: 'blur(140px)', opacity: 0.15, animation: 'float2 20s ease-in-out infinite' }} />
      
      <div style={{ position: 'absolute', top: '15%', right: '10%', width: '30vw', height: '30vw', background: '#f59e0b', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.12, animation: 'float3 15s ease-in-out infinite' }} />
    </div>
  );
}