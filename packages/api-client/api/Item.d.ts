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

import { HttpClient, HttpResponse, RequestParams } from "./http-client";
export declare class Item<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Get item
   *
   * @tags item
   * @name ItemList
   * @summary Get item
   * @request GET:/item
   */
  itemList: (params?: RequestParams) => Promise<
    HttpResponse<
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
    >
  >;
}
