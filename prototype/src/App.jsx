import { useEffect } from 'react';
import AppShell from './components/AppShell';
import PrototypeSwitcher from './components/PrototypeSwitcher';
import { featureTrees } from './model';
import { useSharedScope } from './useSharedScope';
import CodePage from './pages/CodePage';
import FeaturesPage from './pages/FeaturesPage';
import FlowPage from './pages/FlowPage';
import HomePage from './pages/HomePage';
import LayersPage from './pages/LayersPage';
import PipelinePage from './pages/PipelinePage';
import TimelinePage from './pages/TimelinePage';

const pages = {
  '/': HomePage,
  '/features': FeaturesPage,
  '/flow': FlowPage,
  '/timeline': TimelinePage,
  '/layers': LayersPage,
  '/code': CodePage,
  '/pipeline': PipelinePage,
};

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const variant = ['A', 'B', 'C'].includes(params.get('variant')) ? params.get('variant') : 'A';
  const root = featureTrees[variant].id;
  const shared = useSharedScope(root);
  const Page = pages[window.location.pathname] || HomePage;

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
        const order = ['A', 'B', 'C'];
        const next = order[(order.indexOf(variant) + (event.key === 'ArrowRight' ? 1 : -1) + 3) % 3];
        const nextParams = new URLSearchParams(window.location.search);
        nextParams.set('variant', next);
        window.location.search = nextParams.toString();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [variant]);

  return (
    <AppShell
      variant={variant}
      scope={shared.scope}
      following={shared.following}
      onFollowingChange={shared.setFollowing}
    >
      <Page variant={variant} {...shared} />
      <PrototypeSwitcher variant={variant} />
    </AppShell>
  );
}
