import { FeatureShowcaseRow, MarketingPage } from '@/app/components/MarketingChrome';
import { marketingImages } from '@/app/lib/marketingImages';

export default function FamiliesPage() {
  return (
    <MarketingPage eyebrow="02 - For families" title={<>Keep everyone connected to the stories that matter.</>} body="For families preserving parents, grandparents, childhood memories, old photos, chats, and life milestones.">
      <section className="mx-auto max-w-7xl space-y-16 px-4 py-20 sm:px-6 lg:px-8">
        <FeatureShowcaseRow eyebrow="Family archive" title="One place for memories, people, and relationships" body="MemoryGraph creates memory cards, family profiles, family tree relationships, weekly letters, and storybooks from real source material." bullets={['Story Companion sessions', 'Source-backed person profiles', 'Shareable weekly letters']} image={marketingImages.family} />
        <FeatureShowcaseRow eyebrow="Legacy output" title="Turn memories into family-ready stories" body="Generate Time Machine chapters and illustrated storybooks so the archive feels emotional and easy to share." bullets={['Storybook gallery', 'Heart moments', 'Life reconstruction']} image={marketingImages.photos} reverse />
      </section>
    </MarketingPage>
  );
}
