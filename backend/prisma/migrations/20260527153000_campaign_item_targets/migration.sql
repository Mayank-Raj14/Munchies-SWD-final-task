-- Add optional item-level targeting for campaigns
CREATE TABLE "CampaignItem" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampaignItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CampaignItem_campaignId_itemId_key" ON "CampaignItem"("campaignId", "itemId");
CREATE INDEX "CampaignItem_itemId_idx" ON "CampaignItem"("itemId");

ALTER TABLE "CampaignItem"
ADD CONSTRAINT "CampaignItem_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CampaignItem"
ADD CONSTRAINT "CampaignItem_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
