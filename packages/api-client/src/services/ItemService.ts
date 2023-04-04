/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ItemService {

    /**
     * Get item
     * Get item
     * @returns any Default Response
     * @throws ApiError
     */
    public static getItem(): CancelablePromise<{
item?: {
id: number;
name: string;
price: number;
quantity: number;
description: string;
};
}> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/item',
        });
    }

}
