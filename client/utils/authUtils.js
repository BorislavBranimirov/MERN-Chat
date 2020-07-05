// function that checks if access token is expired and renews it if it can
// returns true and deletes token info from client if access token can't be used
// or if access token is expired and refresh token is missing or invalid
// otherwise return false
// i.e. if true is returned user should be asked to log in again to provide new tokens manually
export const checkTokenExpiry = async () => {
    const token = localStorage.getItem('accessToken');
    let expiryDateInMs;
    try {
        expiryDateInMs = JSON.parse(window.atob(token.split('.')[1])).exp * 1000;
    } catch (err) {
        // if token expiry time is invalid and can't be parsed, remove current token data
        logout();
        return true;
    }

    // time in ms before token expiry when token should be renewed anyway
    // to avoid the situation of token expiry before the next immediate request but after this check
    // 1 min - 60000 ms
    const maxMsBeforeExpiry = 60000;
    const shouldRenew = (expiryDateInMs - Date.now() - maxMsBeforeExpiry) <= 0;
    if (!shouldRenew) {
        return false;
    } else {
        try {
            const res = await fetch('/api/auth/refresh-token', {
                method: 'POST'
            });

            if (res.status === 401) {
                // if refresh token is expired or missing, remove current token data
                logout();
                return true;
            }

            const resJSON = await res.json();
            // check if an error was returned
            if (resJSON.err) {
                // continue on non-401 type of errors
                return false;
            }

            // if new access token was returned, save it in local storage
            localStorage.setItem('accessToken', resJSON.accessToken);
            return false;
        } catch (err) {
            return false;
        }
    }
};

export const logout = () => {
    localStorage.removeItem('accessToken');
    try {
        fetch('/api/auth/logout', {
            method: 'POST'
        });
    } catch (err) {
        console.log('Error occured while trying to log out');
    }
};