import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  blockUserForStore,
  blockUserGlobally,
  listUserWarnings,
  unblockUserForStore,
  unblockUserGlobally,
  warnUserForStore,
  warnUserGlobally,
} from '../services/governance.service.js';

export const warnGlobalUser = async (req: AuthenticatedRequest, res: Response) => {
  const warning = await warnUserGlobally(
    req.params.userId ?? '',
    req.user?.id ?? '',
    req.body.reason,
  );

  res.status(201).json({ warning });
};

export const blockGlobalUser = async (req: AuthenticatedRequest, res: Response) => {
  const block = await blockUserGlobally(
    req.params.userId ?? '',
    req.user?.id ?? '',
    req.body.reason,
  );

  res.status(200).json({ block });
};

export const unblockGlobalUser = async (req: AuthenticatedRequest, res: Response) => {
  await unblockUserGlobally(req.params.userId ?? '');

  res.status(204).send();
};

export const getUserWarnings = async (req: AuthenticatedRequest, res: Response) => {
  const result = await listUserWarnings(req.params.userId ?? '');

  res.status(200).json(result);
};

export const warnStoreUser = async (req: AuthenticatedRequest, res: Response) => {
  const warning = await warnUserForStore(
    req.params.storeId ?? '',
    req.params.userId ?? '',
    req.user!,
    req.body.reason,
  );

  res.status(201).json({ warning });
};

export const blockStoreUser = async (req: AuthenticatedRequest, res: Response) => {
  const block = await blockUserForStore(
    req.params.storeId ?? '',
    req.params.userId ?? '',
    req.user!,
    req.body.reason,
  );

  res.status(200).json({ block });
};

export const unblockStoreUser = async (req: AuthenticatedRequest, res: Response) => {
  await unblockUserForStore(req.params.storeId ?? '', req.params.userId ?? '', req.user!);

  res.status(204).send();
};
