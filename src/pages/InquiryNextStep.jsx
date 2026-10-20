import { ArrowUpRight } from 'lucide-react';
import { inquiryNextStep } from './inquiryFlow';

export default function InquiryNextStep({ status, audience, onConversation }) {
  const step = inquiryNextStep(status, audience);
  return <section className="inquiry-next-step" aria-label="Next step">
    <div><span className="inquiry-step-label">{audience === 'admin' ? 'Next action' : 'What happens next'}</span><h3>{step.title}</h3><p>{step.description}</p></div>
    <button type="button" className="button button-solid" onClick={onConversation}>{step.action}<ArrowUpRight size={17} aria-hidden="true" /></button>
  </section>;
}
