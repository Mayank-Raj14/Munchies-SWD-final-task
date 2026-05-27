-- Allow multiple per-user store requests; approvals are per store request
DROP INDEX IF EXISTS "StoreOwnershipRequest_userId_key";
