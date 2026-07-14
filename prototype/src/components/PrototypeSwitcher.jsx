import { ArrowLeft, ArrowRight } from 'lucide-react';
import { variants } from '../model';

const order = ['A', 'B', 'C'];

export default function PrototypeSwitcher({ variant }) {
  const move = (direction) => {
    const current = order.indexOf(variant);
    const next = order[(current + direction + order.length) % order.length];
    const params = new URLSearchParams(window.location.search);
    params.set('variant', next);
    window.location.search = params.toString();
  };

  return (
    <div className="prototype-switcher">
      <button title="上一个机制样例" onClick={() => move(-1)}><ArrowLeft size={16} /></button>
      <span><strong>{variant}</strong> — {variants[variant].label}</span>
      <button title="下一个机制样例" onClick={() => move(1)}><ArrowRight size={16} /></button>
    </div>
  );
}
