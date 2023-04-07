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

import { UserModel } from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class User<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags User
   * @name UserDetail
   * @summary Get user by id
   * @request GET:/user/{id}
   */
  userDetail = (id: number, params: RequestParams = {}) =>
    this.request<UserModel, any>({
      path: `/user/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
}
