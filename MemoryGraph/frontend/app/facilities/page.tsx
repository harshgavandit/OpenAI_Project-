import { MarketingPage, PlatformPreviewCard } from '@/app/components/MarketingChrome';
import { marketingImages } from '@/app/lib/marketingImages';

export default function FacilitiesPage() {
  const cards: Array<[string, string, string]> = [
    ['Resident story capture', 'Guided conversations can preserve life history without long forms.', marketingImages.family],
    ['Family updates', 'Weekly letters help relatives stay connected to new stories and moments.', marketingImages.letter],
    ['Supportive care cues', 'Care Signals stay non-medical and focused on gentle family check-ins.', marketingImages.table],
  ];

  return (
    <MarketingPage eyebrow="03 - For facilities" title={<>Life-story software for care and community settings.</>} body="A future facility workflow for reminiscence, family engagement, and source-grounded resident story preservation.">
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-20 sm:px-6 lg:grid-cols-3 lg:px-8">
        {cards.map(([title, body, image]) => <PlatformPreviewCard key={title} title={title} body={body} image={image} />)}
      </section>
    </MarketingPage>
  );
}
