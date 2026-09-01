import {
  RequestedStoreItem,
  selectNearestStore,
  StoreSelectionResult,
} from "./checkout.store-selection.helper";
import { CheckoutStoreSelectionRepository } from "./checkout.store-selection.repository";

export class CheckoutStoreSelectionService {
  constructor(
    private readonly repository = new CheckoutStoreSelectionRepository(),
  ) {}

  async selectStore(
    items: RequestedStoreItem[],
    latitude: number,
    longitude: number,
  ): Promise<StoreSelectionResult> {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const candidates = await this.repository.findCandidates(productIds);
    return selectNearestStore(candidates, items, latitude, longitude);
  }
}
