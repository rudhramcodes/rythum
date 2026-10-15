import { ArrowUpRight } from 'lucide-react';
import PressGrid from '../components/PressGrid';
import { featuredPress, pressItems } from '../data/press';

export default function PressPreview() {
  const previewItems = featuredPress.slice(0, 3);

  return (
    <section id="press" className="section press-preview" aria-labelledby="press-preview-heading">
      <div className="shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Publications & coverage</p>
            <h2 id="press-preview-heading">In the press.</h2>
          </div>
          <a className="text-link" href="/press">
            All 17 articles <ArrowUpRight size={18} />
          </a>
        </div>
        <PressGrid items={previewItems} preview />
        <div className="press-preview-footer">
          <a className="button button-solid press-view-all" href="/press">
            View All Press ({pressItems.length}) →
          </a>
        </div>
      </div>
    </section>
  );
}
