/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import { ItemModel } from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Item<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Get item by id
   *
   * @tags item
   * @name ItemDetail
   * @summary Get item by id
   * @request GET:/item/{id}
   */
  itemDetail = (id: number, params: RequestParams = {}) =>
    this.request<ItemModel, any>({
      path: `/item/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags item
   * @name ItemList
   * @summary Get items
   * @request GET:/item
   */
  itemList = (params: RequestParams = {}) =>
    this.request<ItemModel[], any>({
      path: `/item`,
      method: "GET",
      format: "json",
      ...params,
    });
}
