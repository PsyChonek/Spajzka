import { Api } from '../Api';
import { Cookies } from 'react-cookie';

const cookies = new Cookies();

/**
 * Creates an authenticated API client instance with JWT token from cookies
 */
export const getAuthenticatedClient = (): Api<unknown> => {
    const token = cookies.get('token');

    return new Api({
        baseUrl: process.env.REACT_APP_SpajzkaAPI,
        securityWorker: token ? () => ({
            headers: {
                Authorization: `Bearer ${token}`
            }
        }) : undefined
    });
};

/**
 * Creates an unauthenticated API client instance (for public endpoints)
 */
export const getPublicClient = (): Api<unknown> => {
    return new Api({
        baseUrl: process.env.REACT_APP_SpajzkaAPI,
    });
};
