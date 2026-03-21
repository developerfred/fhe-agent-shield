import { useCurrentFrame, useVideoConfig, AbsoluteFill, Sequence, interpolate, spring } from "remotion";

function Slide({ title, subtitle, bgColor, accentColor, children }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1]);
  const scale = spring({ frame, fps: 30, config: { damping: 15, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center', maxWidth: 800, padding: 40 }}>
        <h1 style={{ color: accentColor, fontSize: 64, fontWeight: 800, marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
          {title}
        </h1>
        <p style={{ color: '#a0a0b0', fontSize: 32, marginBottom: 40, fontFamily: 'Inter, sans-serif' }}>
          {subtitle}
        </p>
        {children}
      </div>
    </AbsoluteFill>
  );
}

function CodeBlock({ children, danger }) {
  return (
    <div style={{
      backgroundColor: '#0a0a0f',
      borderRadius: 12,
      padding: '20px 30px',
      fontFamily: 'Fira Code, monospace',
      fontSize: 18,
      color: danger ? '#ff4466' : '#00f5ff',
      border: `1px solid ${danger ? 'rgba(255,68,102,0.3)' : 'rgba(0,245,255,0.3)'}`,
      marginTop: 20
    }}>
      {children}
    </div>
  );
}

function StepBadge({ num }) {
  return (
    <div style={{
      width: 50,
      height: 50,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #00f5ff, #b400ff)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: 24,
      marginBottom: 20
    }}>
      {num}
    </div>
  );
}

export default function FHEAgentShieldDemo() {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const progress = frame / durationInFrames;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f' }}>
      {/* Slide 1: Title */}
      <Sequence from={0} durationInFrames={fps * 3}>
        <AbsoluteFill style={{
          backgroundColor: '#0a0a0f',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}>
          <div style={{
            width: 300,
            height: 300,
            background: 'linear-gradient(135deg, #00f5ff, #b400ff)',
            borderRadius: 20,
            marginBottom: 40,
            opacity: interpolate(frame, [0, 30], [0, 1]),
            transform: `scale(${spring({ frame, fps, config: { damping: 12 } })})`
          }} />
          <h1 style={{
            color: '#fff',
            fontSize: 80,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00f5ff, #b400ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Inter, sans-serif',
            opacity: interpolate(frame, [15, 45], [0, 1])
          }}>
            FHE-Agent Shield
          </h1>
          <p style={{
            color: '#a0a0b0',
            fontSize: 28,
            marginTop: 20,
            fontFamily: 'Inter, sans-serif',
            opacity: interpolate(frame, [30, 60], [0, 1])
          }}>
            Privacy-by-Design for AI Agents
          </p>
          <p style={{
            color: '#666',
            fontSize: 18,
            marginTop: 60,
            fontFamily: 'Inter, sans-serif'
          }}>
            Built with Fhenix CoFHE • FHE-Agent Shield Buildathon 2026
          </p>
        </AbsoluteFill>
      </Sequence>

      {/* Slide 2: The Problem */}
      <Sequence from={fps * 3} durationInFrames={fps * 4}>
        <Slide
          title="The Problem"
          subtitle="AI Agents Store Sensitive Data in Plaintext"
          bgColor="#0a0a0f"
          accentColor="#ff4466"
        >
          <CodeBlock danger>
            <div>const credentials = {'{'}</div>
            <div style={{ color: '#ff4466' }}>  apiKey: "sk-1234567890...",</div>
            <div style={{ color: '#ff4466' }}>  password: "super_secret"</div>
            <div>{'}'}</div>
          </CodeBlock>
          <p style={{ color: '#ff4466', fontSize: 20, marginTop: 30 }}>
            ⚠️ Vulnerable to theft and prompt injection attacks
          </p>
        </Slide>
      </Sequence>

      {/* Slide 3: The Solution */}
      <Sequence from={fps * 7} durationInFrames={fps * 4}>
        <Slide
          title="The Solution"
          subtitle="Fully Homomorphic Encryption (FHE)"
          bgColor="#0a0a0f"
          accentColor="#00f5ff"
        >
          <div style={{ display: 'flex', gap: 20, marginTop: 30 }}>
            <div style={{
              background: '#12121a',
              borderRadius: 12,
              padding: 20,
              border: '1px solid rgba(0,245,255,0.3)'
            }}>
              <div style={{ color: '#00f5ff', fontSize: 24, fontWeight: 700 }}>AgentVault</div>
              <div style={{ color: '#a0a0b0', fontSize: 14 }}>Encrypted Credentials</div>
            </div>
            <div style={{
              background: '#12121a',
              borderRadius: 12,
              padding: 20,
              border: '1px solid rgba(0,245,255,0.3)'
            }}>
              <div style={{ color: '#00f5ff', fontSize: 24, fontWeight: 700 }}>AgentMemory</div>
              <div style={{ color: '#a0a0b0', fontSize: 14 }}>Encrypted Context</div>
            </div>
            <div style={{
              background: '#12121a',
              borderRadius: 12,
              padding: 20,
              border: '1px solid rgba(0,245,255,0.3)'
            }}>
              <div style={{ color: '#00f5ff', fontSize: 24, fontWeight: 700 }}>ActionSealer</div>
              <div style={{ color: '#a0a0b0', fontSize: 14 }}>Sealed Actions</div>
            </div>
          </div>
          <p style={{ color: '#00ff88', fontSize: 20, marginTop: 30 }}>
            ✓ Data encrypted on-chain, only accessible with permission
          </p>
        </Slide>
      </Sequence>

      {/* Slide 4: Demo Steps */}
      <Sequence from={fps * 11} durationInFrames={fps * 5}>
        <AbsoluteFill style={{ backgroundColor: '#0a0a0f', padding: 60 }}>
          <h1 style={{ color: '#fff', fontSize: 48, fontWeight: 800, marginBottom: 40, textAlign: 'center' }}>
            5-Step Demo
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { n: 1, text: 'Plaintext Vulnerability Exposed', color: '#ff4466' },
              { n: 2, text: 'FHE Encryption Applied', color: '#00f5ff' },
              { n: 3, text: 'Prompt Injection Blocked', color: '#00ff88' },
              { n: 4, text: 'Sealed Actions with Threshold', color: '#b400ff' },
              { n: 5, text: 'Encrypted Agent Memory', color: '#00f5ff' },
            ].map((step, i) => (
              <Sequence key={step.n} from={fps * 2 + i * 20} durationInFrames={fps * 2}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  opacity: interpolate(frame, [i * 20, i * 20 + 20], [0, 1])
                }}>
                  <StepBadge num={step.n} />
                  <span style={{ color: step.color, fontSize: 28, fontFamily: 'Inter, sans-serif' }}>
                    {step.text}
                  </span>
                </div>
              </Sequence>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Slide 5: Contracts */}
      <Sequence from={fps * 16} durationInFrames={fps * 4}>
        <AbsoluteFill style={{ backgroundColor: '#0a0a0f', padding: 60 }}>
          <h1 style={{ color: '#fff', fontSize: 48, fontWeight: 800, marginBottom: 40, textAlign: 'center' }}>
            150 Tests Passing
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {[
              { name: 'AgentVault', tests: 19 },
              { name: 'AgentMemory', tests: 22 },
              { name: 'SkillRegistry', tests: 17 },
              { name: 'ActionSealer', tests: 25 },
            ].map((contract) => (
              <div key={contract.name} style={{
                background: '#12121a',
                borderRadius: 16,
                padding: 30,
                border: '1px solid rgba(0,245,255,0.3)',
                textAlign: 'center'
              }}>
                <div style={{ color: '#00f5ff', fontSize: 24, fontWeight: 700 }}>{contract.name}</div>
                <div style={{ color: '#a0a0b0', fontSize: 16, marginTop: 8 }}>{contract.tests} tests</div>
              </div>
            ))}
          </div>
          <p style={{ color: '#00ff88', fontSize: 24, textAlign: 'center', marginTop: 40 }}>
            ✓ All tests green on Arbitrum Sepolia
          </p>
        </AbsoluteFill>
      </Sequence>

      {/* Slide 6: CTA */}
      <Sequence from={fps * 20} durationInFrames={fps * 4}>
        <AbsoluteFill style={{
          backgroundColor: '#0a0a0f',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}>
          <h1 style={{
            color: '#fff',
            fontSize: 64,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00f5ff, #b400ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Inter, sans-serif'
          }}>
            Try It Now
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: 28, marginTop: 20, fontFamily: 'Inter, sans-serif' }}>
            github.com/fhenixprotocol/fhe-agent-shield
          </p>
          <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
            <div style={{
              background: 'linear-gradient(135deg, #00f5ff, #b400ff)',
              borderRadius: 12,
              padding: '15px 30px',
              fontWeight: 700,
              fontSize: 18
            }}>
              npm install @fhenix/fhe-agent-shield
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}