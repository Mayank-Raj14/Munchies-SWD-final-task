import type { Prisma } from '@prisma/client';

const MAX_SEARCH_TOKENS = 5;
const MAX_SEARCH_LENGTH = 100;

/** Strip PostgreSQL ILIKE wildcards — Prisma `contains` does not set an ESCAPE clause. */
export const sanitizeLikePattern = (value: string): string =>
  value.replace(/[%_\\]/g, '').trim();

/** Normalize free-text search: trim, collapse whitespace, cap length. */
export const normalizeSearchQuery = (raw?: string): string | undefined => {
  if (raw == null) {
    return undefined;
  }

  const normalized = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_SEARCH_LENGTH);

  return normalized.length > 0 ? normalized : undefined;
};

/** Split a search string into tokens for AND-style matching. */
export const tokenizeSearchQuery = (search: string): string[] => {
  const tokens = search
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  return tokens.slice(0, MAX_SEARCH_TOKENS);
};

const tokenMatchesStore = (token: string): Prisma.StoreWhereInput | null => {
  const pattern = sanitizeLikePattern(token);

  if (!pattern) {
    return null;
  }

  return {
    OR: [
      { name: { contains: pattern, mode: 'insensitive' } },
      { roomNumber: { contains: pattern, mode: 'insensitive' } },
      { hostel: { name: { contains: pattern, mode: 'insensitive' } } },
      { owner: { name: { contains: pattern, mode: 'insensitive' } } },
    ],
  };
};

export const buildStoreListWhere = (input: {
  search?: string;
  hostelId?: string;
}): Prisma.StoreWhereInput => {
  const filters: Prisma.StoreWhereInput[] = [];

  if (input.hostelId) {
    filters.push({ hostelId: input.hostelId });
  }

  const search = normalizeSearchQuery(input.search);

  if (search) {
    const tokens = tokenizeSearchQuery(search);

    const tokenFilters = tokens
      .map((token) => tokenMatchesStore(token))
      .filter((clause): clause is Prisma.StoreWhereInput => clause !== null);

    const [singleTokenFilter] = tokenFilters;

    if (tokenFilters.length === 1 && singleTokenFilter) {
      filters.push(singleTokenFilter);
    } else if (tokenFilters.length > 1) {
      filters.push({ AND: tokenFilters });
    }
  }

  if (filters.length === 0) {
    return {};
  }

  const [onlyFilter] = filters;

  if (filters.length === 1 && onlyFilter) {
    return onlyFilter;
  }

  return { AND: filters };
};
