/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  accessCode?: string;
}

export interface UpdateUserDto {
  username?: string;
  displayName?: string;
}

export interface ItemDto {
  id: string;
  name: string;
  isOnBuylist: boolean;
  /** @format double */
  amount: number;
  /** @format double */
  price: number;
  groupId: string;
  userId: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

export interface GroupDto {
  id: string;
  name: string;
  description?: string;
  userIds: string[];
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

export interface CreateItemDto {
  name: string;
  isOnBuylist?: boolean;
  /** @format double */
  amount?: number;
  /** @format double */
  price?: number;
  groupId: string;
  userId: string;
}

export interface UpdateItemDto {
  name?: string;
  isOnBuylist?: boolean;
  /** @format double */
  amount?: number;
  /** @format double */
  price?: number;
  groupId?: string;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  userIds?: string[];
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
}

export interface AddUserToGroupDto {
  userId: string;
}

export interface CreateUserDto {
  username: string;
  displayName?: string;
}

export interface TokenResponseDto {
  token: string;
  /** @format double */
  expiresIn: number;
  user: UserDto;
}

export interface LoginDto {
  accessCode: string;
}

export interface ResetAccessCodeResponseDto {
  accessCode: string;
}

export interface UpgradeGuestDto {
  username: string;
  displayName?: string;
}

// Type aliases for backward compatibility
export type ItemModel = ItemDto;
export type GroupModel = GroupDto;
export type UserModel = UserDto;

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Spajzka API
 * @version 1.0.0
 * @contact API Support <support@example.com>
 *
 * API for managing shopping lists
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  users = {
    /**
     * @description Get all users
     *
     * @tags Users
     * @name GetAllUsers
     * @request GET:/users
     * @secure
     */
    getAllUsers: (params: RequestParams = {}) =>
      this.request<UserDto[], any>({
        path: `/users`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a user by ID
     *
     * @tags Users
     * @name GetUser
     * @request GET:/users/{userId}
     * @secure
     */
    getUser: (userId: string, params: RequestParams = {}) =>
      this.request<UserDto, void>({
        path: `/users/${userId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a user
     *
     * @tags Users
     * @name UpdateUser
     * @request PUT:/users/{userId}
     * @secure
     */
    updateUser: (
      userId: string,
      data: UpdateUserDto,
      params: RequestParams = {},
    ) =>
      this.request<UserDto, void>({
        path: `/users/${userId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a user
     *
     * @tags Users
     * @name DeleteUser
     * @request DELETE:/users/{userId}
     * @secure
     */
    deleteUser: (userId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/users/${userId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Get all items for a user
     *
     * @tags Users
     * @name GetUserItems
     * @request GET:/users/{userId}/items
     * @secure
     */
    getUserItems: (userId: string, params: RequestParams = {}) =>
      this.request<ItemDto[], void>({
        path: `/users/${userId}/items`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get all groups for a user
     *
     * @tags Users
     * @name GetUserGroups
     * @request GET:/users/{userId}/groups
     * @secure
     */
    getUserGroups: (userId: string, params: RequestParams = {}) =>
      this.request<GroupDto[], void>({
        path: `/users/${userId}/groups`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  items = {
    /**
     * @description Get all items
     *
     * @tags Items
     * @name GetAllItems
     * @request GET:/items
     * @secure
     */
    getAllItems: (params: RequestParams = {}) =>
      this.request<ItemDto[], any>({
        path: `/items`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new item
     *
     * @tags Items
     * @name CreateItem
     * @request POST:/items
     * @secure
     */
    createItem: (data: CreateItemDto, params: RequestParams = {}) =>
      this.request<ItemDto, void>({
        path: `/items`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get an item by ID
     *
     * @tags Items
     * @name GetItem
     * @request GET:/items/{itemId}
     * @secure
     */
    getItem: (itemId: string, params: RequestParams = {}) =>
      this.request<ItemDto, void>({
        path: `/items/${itemId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update an item
     *
     * @tags Items
     * @name UpdateItem
     * @request PUT:/items/{itemId}
     * @secure
     */
    updateItem: (
      itemId: string,
      data: UpdateItemDto,
      params: RequestParams = {},
    ) =>
      this.request<ItemDto, void>({
        path: `/items/${itemId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete an item
     *
     * @tags Items
     * @name DeleteItem
     * @request DELETE:/items/{itemId}
     * @secure
     */
    deleteItem: (itemId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/items/${itemId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  health = {
    /**
     * @description Health check endpoint
     *
     * @tags Health
     * @name HealthCheck
     * @request GET:/health
     */
    healthCheck: (params: RequestParams = {}) =>
      this.request<
        {
          status: string;
        },
        any
      >({
        path: `/health`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  groups = {
    /**
     * @description Get all groups
     *
     * @tags Groups
     * @name GetAllGroups
     * @request GET:/groups
     * @secure
     */
    getAllGroups: (params: RequestParams = {}) =>
      this.request<GroupDto[], any>({
        path: `/groups`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new group
     *
     * @tags Groups
     * @name CreateGroup
     * @request POST:/groups
     * @secure
     */
    createGroup: (data: CreateGroupDto, params: RequestParams = {}) =>
      this.request<GroupDto, void>({
        path: `/groups`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get a group by ID
     *
     * @tags Groups
     * @name GetGroup
     * @request GET:/groups/{groupId}
     * @secure
     */
    getGroup: (groupId: string, params: RequestParams = {}) =>
      this.request<GroupDto, void>({
        path: `/groups/${groupId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update a group
     *
     * @tags Groups
     * @name UpdateGroup
     * @request PUT:/groups/{groupId}
     * @secure
     */
    updateGroup: (
      groupId: string,
      data: UpdateGroupDto,
      params: RequestParams = {},
    ) =>
      this.request<GroupDto, void>({
        path: `/groups/${groupId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a group
     *
     * @tags Groups
     * @name DeleteGroup
     * @request DELETE:/groups/{groupId}
     * @secure
     */
    deleteGroup: (groupId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/groups/${groupId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Add a user to a group
     *
     * @tags Groups
     * @name AddUserToGroup
     * @request POST:/groups/{groupId}/users
     * @secure
     */
    addUserToGroup: (
      groupId: string,
      data: AddUserToGroupDto,
      params: RequestParams = {},
    ) =>
      this.request<GroupDto, void>({
        path: `/groups/${groupId}/users`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Remove a user from a group
     *
     * @tags Groups
     * @name RemoveUserFromGroup
     * @request DELETE:/groups/{groupId}/users/{userId}
     * @secure
     */
    removeUserFromGroup: (
      groupId: string,
      userId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/groups/${groupId}/users/${userId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  auth = {
    /**
     * @description Register a new user with username only. Returns a unique access code (UUID) for login.
     *
     * @tags Authentication
     * @name Register
     * @request POST:/auth/register
     */
    register: (data: CreateUserDto, params: RequestParams = {}) =>
      this.request<UserDto, void>({
        path: `/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Register a new guest user with auto-generated username. Automatically logs in and returns JWT token.
     *
     * @tags Authentication
     * @name RegisterGuest
     * @request POST:/auth/register-guest
     */
    registerGuest: (params: RequestParams = {}) =>
      this.request<TokenResponseDto, void>({
        path: `/auth/register-guest`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Login using access code. Returns JWT token and user info.
     *
     * @tags Authentication
     * @name Login
     * @request POST:/auth/login
     */
    login: (data: LoginDto, params: RequestParams = {}) =>
      this.request<TokenResponseDto, void>({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Reset access code. Generates a new UUID and invalidates the old one (logs out all devices). Requires authentication.
     *
     * @tags Authentication
     * @name ResetAccessCode
     * @request POST:/auth/reset-code
     * @secure
     */
    resetAccessCode: (params: RequestParams = {}) =>
      this.request<ResetAccessCodeResponseDto, void>({
        path: `/auth/reset-code`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Upgrade guest account to permanent account with a custom username. Requires authentication.
     *
     * @tags Authentication
     * @name UpgradeGuest
     * @request POST:/auth/upgrade-guest
     * @secure
     */
    upgradeGuest: (data: UpgradeGuestDto, params: RequestParams = {}) =>
      this.request<UserDto, void>({
        path: `/auth/upgrade-guest`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
