import { Cookies } from 'react-cookie';
import { CreateGuestUser, GetUserGroups } from './userService';

const cookies = new Cookies();

/**
 * Initialize authentication on app load
 * Creates a guest user if no token exists and sets up default group
 */
export const initializeAuth = async (): Promise<boolean> => {
    try {
        // Check if user already has a token
        const existingToken = cookies.get('token');
        const existingUserId = cookies.get('userID');

        if (existingToken && existingUserId) {
            // User is already authenticated
            console.log('User already authenticated');

            // Check if group is set, if not, fetch user's groups
            const existingGroupId = cookies.get('groupID');
            if (!existingGroupId) {
                console.log('No group set, fetching user groups...');
                const groupsResult = await GetUserGroups(existingUserId);
                if (groupsResult && groupsResult.data && groupsResult.data.length > 0) {
                    const defaultGroup = groupsResult.data[0];
                    const cookieOptions = { path: '/', maxAge: 31536000 };
                    cookies.set('groupID', defaultGroup.id, cookieOptions);
                    cookies.set('groupName', defaultGroup.name, cookieOptions);
                    console.log('Default group set:', defaultGroup.name);
                }
            }

            return true;
        }

        // No token found, create guest user
        console.log('No authentication found, creating guest user...');
        const result = await CreateGuestUser();

        if (result && result.data) {
            const { token, user } = result.data;

            // Store auth data in cookies (1 year expiry)
            const cookieOptions = { path: '/', maxAge: 31536000 };
            cookies.set('token', token, cookieOptions);
            cookies.set('userID', user.id, cookieOptions);
            cookies.set('userName', user.username, cookieOptions);

            // Store access code if provided (for guest users)
            if (user.accessCode) {
                cookies.set('accessCode', user.accessCode, cookieOptions);
            }

            console.log('Guest user created successfully:', user.username);

            // Fetch and set the default group
            console.log('Fetching default group for guest user...');
            const groupsResult = await GetUserGroups(user.id);
            if (groupsResult && groupsResult.data && groupsResult.data.length > 0) {
                const defaultGroup = groupsResult.data[0];
                cookies.set('groupID', defaultGroup.id, cookieOptions);
                cookies.set('groupName', defaultGroup.name, cookieOptions);
                console.log('Default group set:', defaultGroup.name);
            }

            return true;
        } else {
            console.error('Failed to create guest user');
            return false;
        }
    } catch (error) {
        console.error('Error initializing authentication:', error);
        return false;
    }
};
