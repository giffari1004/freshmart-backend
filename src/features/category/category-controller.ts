import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../validate/validate";
import { CategoryValidation } from "./category-validation";
import { CategoryService } from "./category-service";

export class CategoryController {
  static async getAll(req: Request, res: Response) {
    const { query } = validate(CategoryValidation.GET_ALL_CATEGORY, {
      query: req.query,
    });
    const { categories, meta } = await CategoryService.getAll({ query });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Category retrieved successfully",
      data: categories,
      meta,
    });
  }

  static async create(req: Request, res: Response) {
    const { body } = validate(CategoryValidation.CREATE_CATEGORY, {
      body: req.body,
    });
    const createdById = req.user!.id;
    const category = await CategoryService.create({ body, createdById });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  }

  static async update(req: Request, res: Response) {
    const { params, body } = validate(CategoryValidation.UPDATE_CATEGORY, {
      params: req.params,
      body: req.body,
    });
    const category = await CategoryService.update({ params, body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  }

  static async delete(req: Request, res: Response) {
    const { params } = validate(CategoryValidation.DELETE_CATEGORY, {
      params: req.params,
    });
    const category = await CategoryService.delete({ params });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  }
}
