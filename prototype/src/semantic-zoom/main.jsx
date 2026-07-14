import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import artifact from '../generated/semantic-zoom-model.json';
import SemanticZoomApp from './SemanticZoomApp';
import './semanticZoom.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SemanticZoomApp artifact={artifact} />
  </StrictMode>,
);
