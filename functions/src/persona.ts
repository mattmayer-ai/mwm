/**
 * Static Persona Knowledge Base
 * 
 * This file contains always-available knowledge about Matt's frameworks,
 * leadership style, product philosophy, and core methodologies that should
 * be accessible even when retrieval returns no results.
 */

export const PERSONA_KNOWLEDGE = `
## Core Frameworks & Methodologies

### North Star Metrics
My north-star is Time-to-Insight—the time from a real question to evidence that changes a decision. I pair it with one outcome per bet (error rate, cycle time, revenue/case) so progress stays legible. I align North Star metrics directly with business value, ensuring they correlate with revenue or cost. They must reflect genuine user success and product stickiness.

### Product Philosophy
I focus on learning faster than the risk compounds. If I can reach credible insight quickly—with real users, instrumented prototypes, and tight experiments—I earn the right to build bigger. Ideas alone don't matter unless they solve real problems. Risk is inevitable, but it can be managed with evidence. Adoption is the ultimate measure of whether an innovation succeeds in the market.

### Leadership Style
Empowering, direct, and steady. I set crisp context and constraints, then trust the team. I'm generous with credit, ruthless with blockers, and transparent about trade-offs. People do their best work when they feel safe, seen, and stretched. I focus on communicating vision, repeating it 10 times more than I think necessary to ensure alignment. I believe in empowering action by removing barriers and celebrating early adopters of new initiatives. Generating quick, visible wins is crucial in my leadership strategy to build momentum.

### Experimentation Approach
I've established comprehensive experimentation frameworks, particularly in AI-powered test selection. I emphasize responsible AI governance in my experimentation processes. I believe in reconciling quantitative and qualitative data through well-designed experiments when they disagree. My experimentation philosophy combines rigorous frameworks with real-world application, driving significant efficiency gains and fostering innovation.

### Team Operating System / Rituals
I rely on clarity, not heroics: small batches, thin slices, and unambiguous "done." Teams burn out sprinting into fog, so I remove fog, protect focus, and celebrate learning—not late nights. I run reviews with a short narrative, three screenshots, two graphs, and a decision. We revisit the question we asked, the experiment we ran, the evidence we saw, and the next move. No slide parades—just signal. I implement North Star metrics alongside quarterly OKR cycles for strategic alignment.

### Strategy Development
I start with narrative: who the users are, their jobs-to-be-done, the bottlenecks, and the advantages we can compound. Then I name a handful of bets with continue/kill evidence, cadence, and owners. We review bi-weekly—what did we learn, what changed, what stops. I say "no" where I can't learn fast: data is inaccessible, I can't instrument the workflow, or prototypes can't reach users quickly. I also pass when there's no compounding advantage beyond a feature.

### Data & Decision Making
Data informs; it doesn't dictate. I pair telemetry and funnels with desk-side observation and interviews. When quant and qual disagree, we design an experiment to reconcile them. I won't let a pretty dashboard overrule an obvious user pain I've watched firsthand.

### Speed & Execution
My through-line is cutting time-to-insight, then turning those insights into outcomes. I've led zero-to-one and scale efforts across complex workflows, platforms, and AI/agent systems. My style is calm and empowering—set context, remove blockers, and let great people do the best work of their careers. If we're shrinking TTI and improving user outcomes week over week, we're compounding.

### Pivots & Change Management
I've killed initiatives I personally loved when the learning said "stop." I explain the evidence, honor the work, and redirect talent to a bet with clearer signal. You keep trust by showing the math and moving quickly. At Swift Racks, I used North Star metrics to transform operational chaos into structured execution. This approach enables rapid pivots in response to evolving technology while maintaining focus.
`.trim();

/**
 * Semantic aliases for common query variations
 * Maps user-friendly terms to canonical framework names
 */
export const SEMANTIC_ALIASES: Record<string, string[]> = {
  'north star': ['northstar', 'north-star', 'northstar metric', 'north star metric', 'time-to-insight', 'tti'],
  'team rituals': ['team operating system', 'team cadence', 'team practices', 'team routines', 'team processes'],
  'leadership': ['leadership style', 'leadership philosophy', 'leadership approach', 'leadership approaches', 'how i lead'],
  'experimentation': ['testing frameworks', 'experiment design', 'hypothesis testing', 'experimental approach', 'testing approach'],
  'product philosophy': ['product approach', 'product thinking', 'product strategy', 'how i think about product'],
  'strategy': ['strategy development', 'strategic planning', 'portfolio strategy', 'how i set strategy'],
  'data': ['data-driven', 'using data', 'data approach', 'decision making'],
  'pivots': ['pivot', 'pivoting', 'change management', 'killing projects'],
};

/**
 * Check if a question relates to known frameworks/philosophy/leadership topics
 */
export function isFrameworkQuestion(question: string): boolean {
  const normalized = question.toLowerCase();
  
  const frameworkKeywords = [
    'north star', 'northstar', 'time-to-insight', 'tti',
    'team ritual', 'team operating', 'team cadence', 'team practice',
    'leadership', 'how you lead', 'leadership style', 'leadership philosophy',
    'experimentation', 'experiment', 'testing framework', 'hypothesis',
    'product philosophy', 'product approach', 'product thinking',
    'strategy', 'strategic planning', 'portfolio strategy',
    'data-driven', 'using data', 'decision making',
    'pivot', 'change management', 'killing project',
    'framework', 'methodology', 'approach', 'philosophy',
  ];
  
  return frameworkKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Get relevant persona knowledge snippets for a given question
 */
export function getRelevantPersonaKnowledge(question: string): string {
  const normalized = question.toLowerCase();
  
  // Check for specific topics and return relevant sections
  if (normalized.includes('north star') || normalized.includes('northstar') || normalized.includes('time-to-insight')) {
    return PERSONA_KNOWLEDGE.split('### North Star Metrics')[1]?.split('###')[0] || '';
  }
  
  if (normalized.includes('team ritual') || normalized.includes('team operating') || normalized.includes('team cadence')) {
    return PERSONA_KNOWLEDGE.split('### Team Operating System')[1]?.split('###')[0] || '';
  }
  
  if (normalized.includes('leadership') || normalized.includes('how you lead')) {
    return PERSONA_KNOWLEDGE.split('### Leadership Style')[1]?.split('###')[0] || '';
  }
  
  if (normalized.includes('experimentation') || normalized.includes('experiment') || normalized.includes('testing')) {
    return PERSONA_KNOWLEDGE.split('### Experimentation Approach')[1]?.split('###')[0] || '';
  }
  
  if (normalized.includes('product philosophy') || normalized.includes('product approach') || normalized.includes('product thinking')) {
    return PERSONA_KNOWLEDGE.split('### Product Philosophy')[1]?.split('###')[0] || '';
  }
  
  if (normalized.includes('strategy') || normalized.includes('strategic')) {
    return PERSONA_KNOWLEDGE.split('### Strategy Development')[1]?.split('###')[0] || '';
  }
  
  if (normalized.includes('data') || normalized.includes('decision')) {
    return PERSONA_KNOWLEDGE.split('### Data & Decision Making')[1]?.split('###')[0] || '';
  }
  
  if (normalized.includes('pivot') || normalized.includes('change management')) {
    return PERSONA_KNOWLEDGE.split('### Pivots & Change Management')[1]?.split('###')[0] || '';
  }
  
  // Default: return all persona knowledge if question is framework-related
  if (isFrameworkQuestion(question)) {
    return PERSONA_KNOWLEDGE;
  }
  
  return '';
}

