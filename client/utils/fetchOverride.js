import { checkTokenExpiry } from './authUtils';

const originalFetch = window.fetch;
window.fetch = async function () {
    // check for Authorization header
    if (arguments[1] && arguments[1].headers && arguments[1].headers.Authorization) {
        // token check
        const expired = await checkTokenExpiry();
        // return tokenExpired if token has expired and could not be refreshed
        if (expired) {
            return { tokenExpired: true };
        } else {
            // replace the old authorization header with the current access token
            arguments[1].headers.Authorization = 'Bearer ' + localStorage.getItem('accessToken')
        }
    }

    // proceed with original fetch request
    return originalFetch.apply(this, arguments);
}