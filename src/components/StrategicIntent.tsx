import { Sparkles } from 'lucide-react';

export default function StrategicIntent() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
        <Sparkles size={20} className="text-primary" />
        Strategic Intent
      </h2>

      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
            Weekly Milestone
          </label>
          <div className="bg-surface-container-low p-4 rounded-xl border border-transparent focus-within:border-primary/10 transition-all">
            <textarea
              className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 resize-none font-sans leading-relaxed text-on-surface"
              rows={2}
              defaultValue="Finalize three high-quality portfolio case studies and reach out to 5 mentors."
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
            Monthly Horizon
          </label>
          <div className="bg-surface-container-low p-4 rounded-xl border border-transparent focus-within:border-primary/10 transition-all">
            <textarea
              className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 resize-none font-sans leading-relaxed text-on-surface"
              rows={2}
              defaultValue="Secure two final-round interviews and complete the LEED Sustainability Certification."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
