import { BadRequestError } from "../../../errors/BadRequestError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import {
  calculateDistanceKm,
  isWithinServiceRadius,
} from "../utils/checkout.distance.util";
import type { CheckoutStoreSelectionRepository } from "./checkout.store-selection.repository";

type Candidate = Awaited<
  ReturnType<CheckoutStoreSelectionRepository["findCandidates"]>
>[number];

export interface StoreSelectionResult {
  store: Candidate["store"];
  storeProducts: Candidate[];
  distanceKm: number;
}

export interface RequestedStoreItem {
  productId: string;
  quantity: number;
}

export function selectNearestStore(
  candidates: Candidate[],
  requested: RequestedStoreItem[],
  latitude: number,
  longitude: number,
): StoreSelectionResult {
  const complete = getCompleteGroups(candidates, requested);
  if (!complete.length) throw storeNotFound();
  const stocked = complete.filter((items) => hasStock(items, requested));
  if (!stocked.length) throw stockUnavailable();
  return pickNearest(stocked, latitude, longitude);
}

function getCompleteGroups(
  candidates: Candidate[],
  requested: RequestedStoreItem[],
) {
  return [...groupByStore(candidates).values()].filter((items) =>
    hasAllProducts(items, requested),
  );
}

function groupByStore(candidates: Candidate[]) {
  const groups = new Map<string, Candidate[]>();
  for (const candidate of candidates) addToGroup(groups, candidate);
  return groups;
}

function addToGroup(
  groups: Map<string, Candidate[]>,
  candidate: Candidate,
) {
  const group = groups.get(candidate.storeId) ?? [];
  group.push(candidate);
  groups.set(candidate.storeId, group);
}

function hasAllProducts(
  candidates: Candidate[],
  requested: RequestedStoreItem[],
) {
  return requested.every((item) =>
    candidates.some((candidate) => candidate.productId === item.productId),
  );
}

function hasStock(
  candidates: Candidate[],
  requested: RequestedStoreItem[],
) {
  return requested.every((item) => {
    const candidate = candidates.find(
      (entry) => entry.productId === item.productId,
    );
    return Boolean(
      candidate &&
        candidate.stockQuantity - candidate.reservedStock >= item.quantity,
    );
  });
}

function pickNearest(
  groups: Candidate[][],
  latitude: number,
  longitude: number,
): StoreSelectionResult {
  const selections = groups
    .map((items) => buildSelection(items, latitude, longitude))
    .filter(isWithinRadius);
  if (!selections.length) throw outOfRadius();
  return selections.sort(compareDistance)[0]!;
}

function buildSelection(
  items: Candidate[],
  latitude: number,
  longitude: number,
): StoreSelectionResult {
  const store = items[0]!.store;
  const distanceKm = calculateDistanceKm(
    latitude,
    longitude,
    store.latitude,
    store.longitude,
  );
  return { store, storeProducts: items, distanceKm };
}

function isWithinRadius(selection: StoreSelectionResult) {
  return isWithinServiceRadius(
    selection.distanceKm,
    selection.store.maxServiceRadiusKm,
  );
}

function compareDistance(left: StoreSelectionResult, right: StoreSelectionResult) {
  return left.distanceKm - right.distanceKm;
}

function storeNotFound() {
  return new BadRequestError(CHECKOUT_MESSAGE.STORE_NOT_FOUND);
}

function stockUnavailable() {
  return new BadRequestError(CHECKOUT_MESSAGE.STOCK_NOT_AVAILABLE);
}

function outOfRadius() {
  return new BadRequestError(CHECKOUT_MESSAGE.STORE_OUT_OF_RADIUS);
}
