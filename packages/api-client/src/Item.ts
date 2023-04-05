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

import { HttpClient, RequestParams } from "./http-client";

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
        item?: {
          id: number;
          name: string;
          price: number;
          quantity: number;
          description: string;
        };
      },
      any
    >({
      path: `/item`,
      method: "GET",
      format: "json",
      ...params,
    });
}
