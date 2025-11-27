import { Briefcase, LayoutGrid, Send } from 'lucide-react';
import { WideModal } from './WideModal';
import { ControlsMenu } from './ControlsMenu';
import { useState } from 'react';
import About from '../app/routes/about';
import { ProjectsPage } from '../app/routes/projects';
import Contact from '../app/routes/contact';

export function QuickActionsDock() {
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <div className="quick-actions-dock fixed inset-x-0 bottom-6 z-30 flex justify-center pointer-events-none">
      <div className="flex items-center gap-2 sm:gap-3 rounded-[10px] bg-white/85 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/70 dark:border-gray-800/70 shadow-lg px-3 py-2 pointer-events-auto">
        {/* Experience */}
        <button
          type="button"
          onClick={() => setExperienceOpen(true)}
          className="group flex flex-col items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="Experience"
        >
          <div className="rounded-lg p-1.5 bg-gray-100/70 dark:bg-gray-800/70 group-hover:bg-brand-blue dark:group-hover:bg-brand-blue transition-colors">
            <Briefcase className="w-5 h-5 group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] uppercase tracking-wide hidden sm:block">Experience</span>
        </button>
        <WideModal
          open={experienceOpen}
          onOpenChange={setExperienceOpen}
          title="Experience"
        >
          <About />
        </WideModal>

        {/* Portfolio */}
        <button
          type="button"
          onClick={() => setPortfolioOpen(true)}
          className="group flex flex-col items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="Portfolio"
        >
          <div className="rounded-lg p-1.5 bg-gray-100/70 dark:bg-gray-800/70 group-hover:bg-brand-blue dark:group-hover:bg-brand-blue transition-colors">
            <LayoutGrid className="w-5 h-5 group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] uppercase tracking-wide hidden sm:block">Portfolio</span>
        </button>
        <WideModal
          open={portfolioOpen}
          onOpenChange={setPortfolioOpen}
          title="Portfolio"
        >
          <ProjectsPage />
        </WideModal>

        {/* Connect */}
        <button
          type="button"
          onClick={() => setConnectOpen(true)}
          className="group flex flex-col items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="Connect"
        >
          <div className="rounded-lg p-1.5 bg-gray-100/70 dark:bg-gray-800/70 group-hover:bg-brand-blue dark:group-hover:bg-brand-blue transition-colors">
            <Send className="w-5 h-5 group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] uppercase tracking-wide hidden sm:block">Connect</span>
        </button>
        <WideModal
          open={connectOpen}
          onOpenChange={setConnectOpen}
          title="Connect"
          size="narrow"
        >
          <Contact />
        </WideModal>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 sm:mx-2" />

        {/* Controls Menu */}
        <ControlsMenu />
      </div>
    </div>
  );
}


