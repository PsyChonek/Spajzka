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
   * No description
   *
   * @tags Item
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
