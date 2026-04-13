import { useStore } from './store';
import { TheatreLayer } from './layers/theatre/TheatreLayer';
import { CampaignLayer } from './layers/campaign/CampaignLayer';
import { ActionLayer } from './layers/action/ActionLayer';
import type { Layer } from './types';

const LAYERS: Record<Layer, () => React.JSX.Element> = {
  theatre: TheatreLayer,
  campaign: CampaignLayer,
  action: ActionLayer,
};

function App() {
  const currentLayer = useStore((s) => s.currentLayer);
  const setLayer = useStore((s) => s.setLayer);
  const LayerComponent = LAYERS[currentLayer];

  return (
    <div>
      {/* Dev nav — remove before production */}
      <nav style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.5rem',
        background: '#1a1a1a',
        borderBottom: '1px solid #333',
      }}>
        {(['theatre', 'campaign', 'action'] as const).map((layer) => (
          <button
            key={layer}
            onClick={() => setLayer(layer)}
            style={{
              padding: '0.4rem 1rem',
              background: currentLayer === layer ? '#646cff' : '#2a2a2a',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'system-ui',
              fontSize: '0.85rem',
              textTransform: 'capitalize',
            }}
          >
            {layer}
          </button>
        ))}
      </nav>
      <LayerComponent />
    </div>
  );
}

export default App;
