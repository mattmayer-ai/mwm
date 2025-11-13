import { useEffect } from 'react';
import { injectJSONLD, generatePersonSchema, generateCreativeWorkSchema } from '../../../lib/jsonld';
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

    // Inject CreativeWork schema for resume
    injectJSONLD(generateCreativeWorkSchema({
      name: 'Experience Summary',
      description: 'Professional experience summary',
      url: `${window.location.origin}/resume/mwm-resume.pdf`,
      author: {
        '@type': 'Person',
        name: 'Matt M',
      },
      datePublished: '2025-01-01',
    }), 'jsonld-experience');
  }, []);

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Overview</h1>
      
      {/* Summary */}
      <section className="mb-8">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          I bring 11+ years of product management expertise and 15+ years in systems integration, specializing in transforming complex organizational challenges into measurable business outcomes. Currently Head of Product at Swift Racks, I lead development of enterprise AI platforms including our CNS innovation copilot, achieving $1.8M recurring revenue growth and 85% operational efficiency improvements.
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          My career spans regulated industries from aviation to defense, where I've consistently delivered zero-to-one products under mission-critical constraints. At Air Canada, I pioneered one of the industry's first offline iPad training platforms, reducing friction by 70% and saving $1.5M annually. At RaceRocks, I developed the world's first integrated Replenishment at Sea simulator, delivering $20M+ in operational savings.
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          I distinguish myself through systematic experimentation and customer journey optimization, teaching these principles at Schulich School of Business while actively building AI-powered solutions using GPT-4 and Claude models.
        </p>
      </section>

      {/* Core Skills */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Core Skills</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">AI/ML Product Leadership</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Architected multi-agent AI systems using AWS Bedrock (Claude Sonnet 3.7), GPT-4, and computer vision. Established responsible AI governance frameworks covering bias testing, transparency, and performance monitoring. Built RAG implementations achieving 85% processing efficiency improvements.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Strategic Planning & Roadmapping</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Served on RaceRocks strategy committee for 4 consecutive years, developing 3-5 year roadmaps and annual strategic initiatives. Transformed Swift Racks from operational chaos to structured execution through North Star metrics and quarterly strategic reviews.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Experimentation & Data Insights</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Developed systematic frameworks from idea to assumption to experiment, including AI-powered experiment selection using criteria matrices. Personally logged 697 user complaints at Air Canada to identify root problems. Conducted comprehensive user research pivoting entire product strategies.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Cross-Functional Leadership</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Orchestrated teams across 6+ departments at Air Canada (HR, Finance, IT, DevOps, Training, C-suite). Managed globally distributed defense teams with different security clearances. Currently building product teams while teaching at Schulich.
            </p>
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Overview</h2>
        <div className="space-y-6">
          <div className="border-l-2 border-brand-blue pl-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Swift Racks</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">June 2024 - Present</span>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Head of Product</p>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              Leading AI-powered digital transformation across enterprise clients. Architected CNS (Central Nervous System) innovation platform featuring specialized AI agents for automated product discovery, targeting $4.1M ARR Year 1 scaling to $280M by Year 5. Orchestrated TakeCost strategy pivot through 15 contractor interviews, discovering speed trumped accuracy, achieving 95% conversion improvement. Built AutoTake computer vision system processing 5,200+ blueprint elevations, reducing processing time by 85%.
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mt-2">
              Established comprehensive experimentation framework with AI-powered test selection. Implemented responsible AI governance across GPT-4, Claude, and custom LLM orchestrations. Generated $1.8M recurring revenue through strategic pivots and customer journey optimization.
            </p>
          </div>

          <div className="border-l-2 border-brand-blue pl-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">RaceRocks 3D Inc</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">Sept 2021 - May 2024</span>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senior Product Manager</p>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              Led strategic planning for defense technology portfolio, conducting 4 annual planning cycles with executives. Developed world's first integrated Replenishment at Sea simulator for Canadian Navy, saving $15M+ annually since 2019. Managed product teams across Boeing, Lockheed Martin, and Royal Canadian Navy programs with mission-critical requirements.
            </p>
          </div>

          <div className="border-l-2 border-brand-blue pl-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">RaceRocks 3D Inc</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">July 2018 - Sept 2021</span>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Manager</p>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              Pioneered AR/VR/XR integration for military training systems. Led development of Canadian Armed Forces Naval Training Program for MV ASTERIX. Architected Azure-based systems with xAPI, CMI 5, and WebGL technologies. Conducted classified user research yielding actionable intelligence for defense products.
            </p>
          </div>

          <div className="border-l-2 border-brand-blue pl-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Air Canada</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">Aug 2010 - July 2018</span>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">eLearning Manager, Flight Operations</p>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              Evolved from eLearning Manager to product leadership, orchestrating cross-functional digital transformation. Built industry's first offline iPad-accessible training platform serving thousands of pilots globally. Reduced training friction by 70% through systematic journey mapping, from 10+ clicks to 3. Delivered $1.5M annual savings and 75% engagement increase.
            </p>
          </div>
        </div>
      </section>

      {/* Teaching */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Teaching</h2>
        <div className="border-l-2 border-brand-blue pl-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Schulich School of Business</h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">2024 - Present</span>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Management Instructor</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            Teaching product management principles to next generation of product leaders. Focus on experimentation frameworks, customer discovery, and AI product development. Students work on real product challenges while learning systematic approaches to validation and iteration.
          </p>
        </div>
      </section>

      {/* Education */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Education</h2>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p><strong>DeepLearning.AI</strong> - Machine Learning Specialization (2025)</p>
          <p><strong>Scrum Alliance</strong> - Certified Advanced Scrum Product Owner (A-CSPO) (2022)</p>
          <p><strong>Harvard Business School</strong> - Leadership and Management Training (2013)</p>
          <p><strong>Ryerson University</strong> - Bachelor of Design (Communications), Minor in Marketing (2001-2006)</p>
        </div>
      </section>

      {/* Download PDF option */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <a
          href="/resume/mwm-resume.pdf"
          download
          className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-white hover:bg-brand-pink transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF Resume
        </a>
      </div>
    </main>
  );
}
