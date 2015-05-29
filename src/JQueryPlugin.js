'use strict';

import core from 'bower:metaljs/src/core';

/**
 * Acts as a bridge between Metal.js and jQuery, allowing Metal.js components to
 * be used as jQuery plugins.
 * @type {Object}
 */
var JQueryPlugin = {
  /**
   * Registers a Metal.js component as a jQuery plugin with the given name.
   * @param {string} name The name of the plugin that should be registered.
   * @param {!Function(Object)} Ctor The constructor of the Metal.js component.
   */
  register(name, Ctor) {
    if (!$) {
      throw new Error('jQuery needs to be included in the page for JQueryPlugin to work.');
    }
    if (!core.isString(name)) {
      throw new Error('The name string is required for registering a plugin');
    }
    if (!core.isFunction(Ctor)) {
      throw new Error('The constructor function is required for registering a plugin');
    }

    $.fn[name] = function(configOrMethodName) {
      var args = Array.prototype.slice.call(arguments, 1);
      return handlePluginCall(name, Ctor, this, configOrMethodName, args);
    };
  }
};

/**
 * Calls a method on the plugin instance for the given element.
 * @param {string} name The name of the plugin.
 * @param {!jQuery} element A jQuery collection with a single element.
 * @param {[type]} methodName [description]
 * @return {*} The return value of the called method.
 */
function callMethod(name, element, methodName, args) {
  var fullName = getPluginFullName(name);
  var instance = element.data(fullName);
  if (!instance) {
    throw new Error('Tried to call method ' + methodName + ' on ' + name + ' plugin' +
      'without initialing it first.');
  }
  if (!isValidMethod(instance, methodName)) {
    throw new Error('Plugin ' + name + ' has no method called ' + methodName);
  }
  return instance[methodName].apply(instance, args);
}

/**
 * Creates an instace of a component for the given element, or updates it if one
 * already exists.
 * @param {string} name The name of the plugin.
 * @param {!Function(Object)} Ctor The constructor of the Metal.js component.
 * @param {!jQuery} element A jQuery collection with a single element.
 * @param {Object} config A config object to be passed to the component instance.
 */
function createOrUpdateInstance(name, Ctor, element, config) {
  var fullName = getPluginFullName(name);
  var instance = element.data(fullName);
  config = $.extend({}, config, {
    element: element[0]
  });
  if (instance) {
    instance.setAttrs(config);
  } else {
    element.data(fullName, new Ctor(config).render());
  }
}

/**
 * Gets the full name of the given plugin, by appending a prefix to it.
 * @param {string} name The name of the plugin.
 * @return {string}
 */
function getPluginFullName(name) {
  return 'metal-' + name;
}

/**
 * Handles calls to a registered plugin.
 * @param {string} name The name of the plugin.
 * @param {!Function(Object)} Ctor The constructor of the Metal.js component.
 * @param {!jQuery} collection A jQuery collection of elements to handle the plugin for.
 * @param {?(string|Object)} configOrMethodName If this is a string, a method with
 * that name will be called on the appropriate component instance. Otherwise, an
 * the instance (which will be created if it doesn't yet exist) will receive this
 * as its config object.
 * @param {Array} args All other arguments that were passed to the plugin call.
 */
function handlePluginCall(name, Ctor, collection, configOrMethodName, args) {
  if (core.isString(configOrMethodName)) {
    return callMethod(name, $(collection[0]), configOrMethodName, args);
  } else {
    collection.each(function() {
      createOrUpdateInstance(name, Ctor, $(this), configOrMethodName);
    });
  }
  return collection;
}

/**
 * Checks if the given method is valid. A method is valid if it exists and isn't
 * private.
 * @param {!Object} instance The instance to check for the method.
 * @param {string} methodName The name of the method to check.
 * @return {boolean}
 */
function isValidMethod(instance, methodName) {
  return core.isFunction(instance[methodName]) &&
    methodName[0] !== '_' &&
    methodName[methodName.length - 1] !== '_';
}

export default JQueryPlugin;
