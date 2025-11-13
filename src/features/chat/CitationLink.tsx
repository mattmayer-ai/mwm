import { trackCitationClick } from '../../lib/analytics';

interface CitationLinkProps {
  citation: {
    title: string;
    sourceUrl: string;
  };
  index: number;
  sectionId?: string; // Optional sectionId for deep-linking
}

export function CitationLink({ citation, index, sectionId }: CitationLinkProps) {
  const handleClick = () => {
    // Extract sectionId from sourceUrl if not provided (format: /projects/slug#sec-sectionId)
    const url = new URL(citation.sourceUrl, window.location.origin);
    const hash = url.hash || (sectionId ? `#sec-${sectionId}` : '');
    const targetSectionId = hash.replace('#sec-', '');

    // Track analytics
    if (targetSectionId) {
      const slug = citation.sourceUrl.split('/projects/')[1]?.split('#')[0] || '';
      trackCitationClick(slug, targetSectionId);
    }

    if (citation.sourceUrl.startsWith('/')) {
      // Navigate to the page
      window.location.href = citation.sourceUrl;
      
      // Wait for navigation, then scroll and highlight
      setTimeout(() => {
        if (targetSectionId) {
          const anchor = document.querySelector(`#sec-${targetSectionId}`);
          if (anchor) {
            anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
            anchor.classList.add('ring-2', 'ring-amber-400', 'transition', 'duration-300');
            setTimeout(() => {
              anchor.classList.remove('ring-2', 'ring-amber-400');
            }, 1200);
          }
        }
      }, 100);
    } else {
      window.open(citation.sourceUrl, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-xs text-brand-blue dark:text-brand-blue/80 hover:underline text-left"
    >
      [{index}] {citation.title}
    </button>
  );
}

