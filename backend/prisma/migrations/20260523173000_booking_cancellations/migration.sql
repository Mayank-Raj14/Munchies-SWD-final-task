ALTER TABLE "Booking"
ADD COLUMN "cancellationRequestedAt" TIMESTAMP(3),
ADD COLUMN "cancellationReviewedAt" TIMESTAMP(3),
ADD COLUMN "cancellationRejectedAt" TIMESTAMP(3);

CREATE INDEX "Booking_cancellationRequestedAt_idx" ON "Booking"("cancellationRequestedAt");
