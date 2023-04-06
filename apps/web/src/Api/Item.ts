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

import { ItemCreatePayload } from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Item<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Get item
   *
   * @tags item
   * @name ItemList
   * @summary Get item
   * @request GET:/item
   */
  itemList = (params: RequestParams = {}) =>
    this.request<
      {
        id: number;
        name: string;
        price: number;
        quantity: number;
        description: string;
      }[],
      any
    >({
      path: `/item`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Create item
   *
   * @tags item
   * @name ItemCreate
   * @summary Create item
   * @request POST:/item
   */
  itemCreate = (body: ItemCreatePayload, params: RequestParams = {}) =>
    this.request<object, any>({
      path: `/item`,
      method: "POST",
      body: body,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}
