import { useEffect } from 'react';
import { injectJSONLD, generatePersonSchema } from '../../../lib/jsonld';
import { injectOGTags } from '../../../lib/og';

export default function About() {
  useEffect(() => {
    // Set OG tags
    injectOGTags({
      title: 'Experience - mwm',
      description: 'Product leader specializing in AI, RAG, and zero-to-one platform work',
      type: 'website',
    });

    // Inject Person schema
    injectJSONLD(generatePersonSchema({
      name: 'Matt M',
      url: window.location.origin,
      sameAs: [
        'https://www.linkedin.com/in/your-handle',
        'https://github.com/your-handle',
      ],
      jobTitle: 'Head of Product / AI',
      description: 'Product leader specializing in AI, RAG, and zero-to-one platform work',
      knowsAbout: ['Product Management', 'GenAI', 'RAG', 'React', 'Firebase'],
    }), 'jsonld-person');

  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-blue">Experience</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Overview</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Dual-track view of my recent leadership roles, core skills, and teaching commitments.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <aside className="space-y-6 rounded-lg border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-gray-800/70 dark:bg-gray-900/90">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Summary</h2>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              I architect product strategies that turn organizational chaos into competitive advantage. Over 14+ years, I've pioneered digital transformations across aviation, defense, and enterprise sectors—from building the world's first offline pilot training platform to developing AI-powered systems that have generated $20M+ in operational savings.
            </p>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              My approach centers on systematic customer discovery, cross-functional coalition building, and responsible AI implementation that drives measurable business outcomes. Currently leading AI platform development at Swift Racks while teaching product management at Schulich, I specialize in zero-to-one product development that transforms how organizations operate and compete.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Core Skills</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">AI/ML Product Leadership</p>
                <p>Architected multi-agent AI systems (AWS Bedrock, GPT-4, CV) and set AI governance with 85% efficiency gains.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Strategic Planning & Roadmapping</p>
                <p>Ran annual strategy cycles at RaceRocks and brought Swift Racks to disciplined North Star execution.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Experimentation & Insights</p>
                <p>Developed AI-powered experiment selection and logged 697 complaints at Air Canada to pivot strategy.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Cross-Functional Leadership</p>
                <p>Led teams across HR, Finance, IT, DevOps, and secure defense programs with mixed clearances.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Teaching</h2>
            <div className="mt-3 rounded-lg border border-slate-200/80 p-4 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-blue">Schulich School of Business</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Product Management Instructor</p>
              <p className="text-xs uppercase tracking-widest text-slate-500">2024 – Present</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Teach experimentation, AI product development, and customer discovery using live product challenges.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Education</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li><strong>DeepLearning.AI</strong> — Machine Learning Specialization (2025)</li>
              <li><strong>Scrum Alliance</strong> — Advanced CSPO (2022)</li>
              <li><strong>Harvard Business School</strong> — Leadership & Management (2013)</li>
              <li><strong>Ryerson University</strong> — Bachelor of Design, Marketing minor (2006)</li>
            </ul>
          </section>
        </aside>

        <section className="space-y-6 rounded-lg border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-gray-800/70 dark:bg-gray-900/90">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Recent Roles</h2>
          <div className="mt-4 space-y-5">
            {[
              {
                company: 'Swift Racks',
                range: '2024 – Present',
                role: 'Head of Product',
                copy: [
                  'Lead the CNS innovation platform and AutoTake CV pipeline, targeting $4.1M ARR in year one and $280M over five years.',
                  'Spun up 15+ specialized agents (discovery, estimating, knowledge graph) with shared memory, evaluation harnesses, and guardrails.',
                  'Ran company-wide experimentation cadence—weekly demos, Friday evidence, Monday decisions—with a 95% funnel conversion lift.',
                  'Instituted AI governance, cost-per-correct tracking, and “plan before you prompt” playbooks to keep latency low and accuracy high.',
                ],
              },
              {
                company: 'RaceRocks 3D (Senior PM)',
                range: '2021 – 2024',
                role: 'Senior Product Manager',
                copy: [
                  'Owned defense portfolio strategy, coordinating Boeing, Lockheed Martin, and Royal Canadian Navy programs with shared bets/risks board.',
                  'Launched the first integrated Replenishment at Sea simulator, delivering $15M+ annual savings and cutting training time by 40%.',
                  'Ran four annual planning cycles with exec staff, linking roadmaps to readiness metrics and “continue / kill / amplify” evidence.',
                  'Scaled the platform team by codifying paved roads (Unity/Unreal primitives, telemetry contracts, deployment SLAs).',
                ],
              },
              {
                company: 'RaceRocks 3D',
                range: '2018 – 2021',
                role: 'Product Manager',
                copy: [
                  'Built AR/VR/XR training systems for CAF Naval programs, architecting Azure + xAPI telemetry stacks with secure sandboxing.',
                  'Led classified user research sprints that translated hand-written checklists into instrumented workflows.',
                  'Delivered MV ASTERIX training modules end-to-end: requirements capture, scenario design, validation, and deployment.',
                ],
              },
              {
                company: 'Air Canada',
                range: '2010 – 2018',
                role: 'eLearning Manager, Flight Operations',
                copy: [
                  'Launched the first offline iPad training platform for pilots, cutting friction 70% (10+ clicks → 3) and saving $1.5M annually.',
                  'Captured 697 pain points from the global pilot corps, using them to prioritize roadmap slices and regulatory compliance work.',
                  'Built cross-functional rituals (flight ops, IT, DevOps, HR) that reduced update cycle time from months to weeks.',
                ],
              },
            ].map((job) => (
              <article key={job.company} className="rounded-lg border border-slate-200/80 p-5 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{job.company}</h3>
                  <span className="text-xs uppercase tracking-widest text-slate-500">{job.range}</span>
                </div>
                <p className="text-sm font-medium text-brand-blue">{job.role}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {Array.isArray(job.copy)
                    ? job.copy.map((line) => <li key={line}>• {line}</li>)
                    : <li>• {job.copy}</li>}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
