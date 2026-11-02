import type { SpaceId } from "../../devdocs";
import type { DocContent } from "../schema";
import { PAGES as productsStart } from "./products-start";
import { PAGES as productsCodex } from "./products-codex";
import { PAGES as devStart } from "./dev-start";
import { PAGES as devPortal } from "./dev-portal";
import { PAGES as devSwap } from "./dev-swap";
import { PAGES as devOrders } from "./dev-orders";
import { PAGES as devOrdersMore } from "./dev-orders-more";
import { PAGES as devPortalMore } from "./dev-portal-more";
import { PAGES as devSwapRef } from "./dev-swap-ref";

/** Every page body, by space then slug. One file per sidebar section keeps edits independent. */
export const CONTENT: Record<SpaceId, Record<string, DocContent>> = {
  products: { ...productsStart, ...productsCodex },
  developer: { ...devStart, ...devPortal, ...devPortalMore, ...devSwap, ...devSwapRef, ...devOrders, ...devOrdersMore },
};

export function contentFor(space: SpaceId, slug: string): DocContent | undefined {
  return CONTENT[space][slug];
}
