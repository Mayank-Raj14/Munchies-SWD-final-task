# TODO
- [ ] Understand current booking expiry and cancellation logic (scheduler/job + booking.service)
- [ ] Identify where cancellation review fields are being set during auto-expiry (finishBookingWithSingleRestock)
- [ ] Refactor booking expiry to use a dedicated expiry transition that does NOT mutate cancellation review fields
- [ ] Ensure inventory restoration, warning assignment, email notifications remain unchanged
- [ ] Keep booking state transition validation deterministic/valid
- [ ] Prevent scheduler/job regressions (ensure expireUncollectedOrders still triggers correctly)
- [x] Run backend typecheck and basic lifecycle verification (expiry, cancellation approve/reject)


