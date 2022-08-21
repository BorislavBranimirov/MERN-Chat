import React from 'react';
import { Route, Redirect } from 'react-router-dom';

/**
 * Wrapper around Route.
 * If no 'accessToken' key is found in local storage, redirects instead of rendering component
 * @param {boolean} reverse - flips the condition, so that it redirects if key is found, defaults to false
 * @param {string} redirectURL - url to redirect to, defaults to '/login'
 */
const PrivateRoute = ({ reverse = false, redirectURL = '/login', ...rest }) => {
  let success = localStorage.getItem('accessToken') !== null;
  if (reverse) success = !success;

  if (!success) {
    // remove any components passed to the route
    const { component, render, children, ...noComponentRest } = rest;
    return (
      <Route {...noComponentRest}>
        <Redirect to={redirectURL} />
      </Route>
    );
  }

  return <Route {...rest} />;
};

export default PrivateRoute;
