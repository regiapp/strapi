'use strict';

const _ = require('lodash');
const {
  policy: { createPolicyFactory },
} = require('strapi-utils');
const { validateHasPermissionsInput } = require('../../validation/policies/hasPermissions');

const inputModifiers = [
  {
    check: _.isString,
    transform: action => ({ action }),
  },
  {
    check: _.isArray,
    transform: arr => ({ action: arr[0], subject: arr[1] }),
  },
  {
    check: _.isObject,
    transform: perm => perm,
  },
];

module.exports = createPolicyFactory(
  input => {
    const permissions = input.map(val =>
      inputModifiers.find(modifier => modifier.check(val)).transform(val)
    );

    return (ctx, next) => {
      const { userAbility: ability } = ctx.state;

      const isAuthorized = permissions.every(({ action, subject }) => ability.can(action, subject));

      if (!isAuthorized) {
        throw strapi.errors.forbidden();
      }

      return next();
    };
  },
  {
    validator: validateHasPermissionsInput,
    name: 'admin::hasPermissions',
  }
);
