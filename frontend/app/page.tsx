import { CampaignBanner } from '@/components/campaign-banner';
import { StoreDirectory } from '@/components/store-directory';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <CampaignBanner />
      <StoreDirectory />
    </div>
  );
}