import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Approach",
  description:
    "AffiGrove researches before it scales a publication, reviews original work, and keeps distribution and spend under human approval.",
};

const STEPS = [
  {
    title: "Research before scale",
    body: "A publication is not treated as ready until the audience for it has been studied from sources the company may use.",
  },
  {
    title: "A person reviews the work",
    body: "Original writing, design, and video are checked by a person before they are treated as finished. Software can prepare work. It does not replace that review.",
  },
  {
    title: "Say what was collected",
    body: "Performance is discussed from results the company has actually collected. Projections are not published as if they were receipts.",
  },
  {
    title: "Keep spend under approval",
    body: "Distribution and advertising spend require a person’s approval. The company does not describe private budgets on this site.",
  },
];

export default function ApproachPage() {
  return (
    <article className="grove-prose">
      <p className="grove-kicker">Our approach</p>
      <h1>Slow where it matters.</h1>
      <p className="grove-lede">
        AffiGrove’s public standard is simple: research the audience, make original work, measure what was collected, and keep a person accountable for publishing and spend.
      </p>
      <div className="grove-practices">
        {STEPS.map((step, index) => (
          <article key={step.title} className="grove-card">
            <span>0{index + 1}</span>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
