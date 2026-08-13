import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { InventoryService } from "./inventory-service";
import { validate } from "../../validate/validate";
import { InventoryValidation } from "./inventory-validation";

export class InventoryController {
  static async getAllInventory(req: Request, res: Response) {
    const { query } = validate(InventoryValidation.GET_ALL_INVENTORY, {
      query: req.query,
    });
    const { inventories, meta } = await InventoryService.getAllInventory({
      query,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Inventory retrieved successfully",
      data: inventories,
      meta,
    });
  }
  static async createInventory(req: Request, res: Response) {
    const { body } = validate(InventoryValidation.CREATE_INVENTORY, {
      body: req.body,
    });
    const inventory = await InventoryService.createInventory({ body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Inventory created successfully",
      data: inventory,
    });
  }
  static async updateInventory(req: Request, res: Response) {
    const { params, body } = validate(InventoryValidation.UPDATE_INVENTORY, {
      params: req.params,
      body: req.body,
    });
    const result = await InventoryService.updateInventory({ params, body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Inventory updated successfully",
      data: result,
    });
  }
  static async deleteInventory(req: Request, res: Response) {
    const { params } = validate(InventoryValidation.DELETE_INVENTORY, {
      params: req.params,
    });
    const result = await InventoryService.deleteInventory({ params });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Inventory deleted successfully",
      data: result,
    });
  }
  static async stockIn(req: Request, res: Response) {
    const { params, body } = validate(InventoryValidation.STOCK_IN, {
      params: req.params,
      body: req.body,
    });
    const user = req.user!;
    const result = await InventoryService.stockIn({ params, body }, user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Stock added successfully",
      data: result,
    });
  }
  static async stockOut(req: Request, res: Response) {
    const { params, body } = validate(InventoryValidation.STOCK_OUT, {
      params: req.params,
      body: req.body,
    });
    const user = req.user!;
    const result = await InventoryService.stockOut({ params, body }, user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Stock reduced successfully",
      data: result,
    });
  }
  static async getStockHistory(req: Request, res: Response) {
    const { params, query } = validate(InventoryValidation.GET_STOCK_HISTORY, {
      params: req.params,
      query: req.query,
    });
    const user = req.user!;
    const { histories, meta } = await InventoryService.getStockHistory(
      {
        params,
        query,
      },
      user,
    );
    res.status(StatusCodes.OK).json({
      success: true,
      message: "History retrived successfully",
      data: histories,
      meta,
    });
  }
}
