import PressGrid from '../components/PressGrid';
import { featuredPress } from '../data/press';

export default function PressPreview() {
  return <section id="press" className="section press-preview" aria-labelledby="press-preview-heading">
    <div className="shell">
      <h2 id="press-preview-heading" className="press-title">In the Press</h2>
      <PressGrid items={featuredPress} preview />
      <a className="button button-solid press-view-all" href="/press">View All Press →</a>
    </div>
  </section>;
}
