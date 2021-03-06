'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _registrations = new Map();

var DependencyContainer = function () {
    function DependencyContainer() {
        _classCallCheck(this, DependencyContainer);
    }

    _createClass(DependencyContainer, null, [{
        key: 'isRegistered',
        value: function isRegistered(registrationName) {
            return _registrations.has(registrationName);
        }
    }, {
        key: 'register',
        value: function register(name) {
            if (!_registrations.has(name)) {
                _registrations.set(name, new DependencyMapping());
            }
            return _registrations.get(name);
        }
    }, {
        key: 'resolve',
        value: function resolve(registrationName, mappingName) {
            if (!_registrations.has(registrationName)) {
                throw new Error(registrationName + ' is not registered.');
            }
            var dependencyMapping = _registrations.get(registrationName);
            if (!dependencyMapping._mappings.has(mappingName)) {
                throw new Error('Mapping ' + mappingName + ' is not registered.');
            }
            var dependencyDetails = dependencyMapping._mappings.get(mappingName);
            return dependencyDetails._resolve();
        }
    }, {
        key: 'inject',
        value: function inject(func) {
            if (!isFunction(func)) {
                throw new TypeError('Must be a function of class');
            }
            var funcArguments = getFunctionParameters(func).map(function (param) {
                return DependencyContainer.resolve(param);
            });
            return func.apply(undefined, _toConsumableArray(funcArguments));
        }
    }]);

    return DependencyContainer;
}();

var DependencyMapping = function () {
    function DependencyMapping() {
        _classCallCheck(this, DependencyMapping);

        this._mappings = new Map();
    }

    _createClass(DependencyMapping, [{
        key: 'asType',
        value: function asType(type, mappingName) {
            if (this._mappings.has(mappingName)) {
                throw new Error((mappingName || 'default') + ' mapping is already registered.');
            }
            var dependencyDetails = new DependencyDetails(type);
            this._mappings.set(mappingName, dependencyDetails);
            return dependencyDetails;
        }
    }]);

    return DependencyMapping;
}();

var DependencyDetails = function () {
    function DependencyDetails(type) {
        _classCallCheck(this, DependencyDetails);

        this._type = type;
        this._resolveWithConstructor = false;
        this._constructorParameterMapper = null;
        this._resolvePropertyValues = false;
        this._propertyValueMapper = false;
        this._isInSingletonScope = false;
        this._resolvedInstance = null;
    }

    _createClass(DependencyDetails, [{
        key: 'withConstructor',
        value: function withConstructor(parameterMapperFunc) {
            if (this._resolveWithConstructor === true) {
                throw new Error('Constructor is already configured.');
            }
            this._resolveWithConstructor = true;
            this._constructorParameterMapper = new ParameterMapper(getFunctionParameters(this._type));
            if (isFunction(parameterMapperFunc)) {
                parameterMapperFunc(this._constructorParameterMapper);
            }
            return this;
        }
    }, {
        key: 'withProperties',
        value: function withProperties(propertyValueMapperFunc) {
            if (this._resolvePropertyValues === true) {
                throw new Error('Property values are already configured.');
            }
            this._resolvePropertyValues = true;
            this._propertyValueMapper = new PropertyMapper();
            if (isFunction(propertyValueMapperFunc)) {
                propertyValueMapperFunc(this._propertyValueMapper);
            }
            return this;
        }
    }, {
        key: 'inSingletonScope',
        value: function inSingletonScope() {
            this._isInSingletonScope = true;
        }
    }, {
        key: '_resolve',
        value: function _resolve() {
            var _this = this;

            if (this._isInSingletonScope && this._resolvedInstance) {
                return this._resolvedInstance;
            } else {
                if (this._resolveWithConstructor === true) {
                    var constructorArguments = this._constructorParameterMapper._resolve();
                    this._resolvedInstance = new (Function.prototype.bind.apply(this._type, [null].concat(_toConsumableArray(constructorArguments))))();
                } else {
                    this._resolvedInstance = new this._type();
                }
                if (this._resolvePropertyValues === true) {
                    this._propertyValueMapper._resolve().forEach(function (_ref) {
                        var _ref2 = _slicedToArray(_ref, 2);

                        var name = _ref2[0];
                        var value = _ref2[1];

                        _this._resolvedInstance[name] = value;
                    });
                }
                return this._resolvedInstance;
            }
        }
    }]);

    return DependencyDetails;
}();

var ParameterMapper = function () {
    function ParameterMapper(parameterNames) {
        _classCallCheck(this, ParameterMapper);

        this._parameterMap = new Map(parameterNames.map(function (param) {
            return [param, new ParameterDetails(param)];
        }));
    }

    _createClass(ParameterMapper, [{
        key: 'param',
        value: function param(name) {
            if (!this._parameterMap.has(name)) {
                throw new Error('Parameter "' + name + '" was not detected.');
            }
            return this._parameterMap.get(name);
        }
    }, {
        key: '_resolve',
        value: function _resolve() {
            return [].concat(_toConsumableArray(this._parameterMap.values())).map(function (param) {
                return param._resolve();
            });
        }
    }]);

    return ParameterMapper;
}();

var PropertyMapper = function () {
    function PropertyMapper() {
        _classCallCheck(this, PropertyMapper);

        this._propertyMap = new Map();
    }

    _createClass(PropertyMapper, [{
        key: 'property',
        value: function property(name) {
            if (!this._propertyMap.has(name)) {
                this._propertyMap.set(name, new ParameterDetails(name));
            }
            return this._propertyMap.get(name);
        }
    }, {
        key: '_resolve',
        value: function _resolve() {
            return [].concat(_toConsumableArray(this._propertyMap.entries())).map(function (_ref3) {
                var _ref4 = _slicedToArray(_ref3, 2);

                var name = _ref4[0];
                var prop = _ref4[1];
                return [name, prop._resolve()];
            });
        }
    }]);

    return PropertyMapper;
}();

var ParameterDetails = function () {
    function ParameterDetails(parameterName) {
        _classCallCheck(this, ParameterDetails);

        this._name = parameterName;

        this._resolveAsValue = false;
        this._valueToResolve = null;

        this._resolveAsDependency = false;
        this._registrationNameToResolve = null;
        this._mappingNameToResolve = null;
    }

    _createClass(ParameterDetails, [{
        key: 'asValue',
        value: function asValue(valueToResolve) {
            this._resolveAsValue = true;
            this._valueToResolve = valueToResolve;
        }
    }, {
        key: 'asDependency',
        value: function asDependency(registrationName, mappingName) {
            this._resolveAsDependency = true;
            this._registrationNameToResolve = registrationName;
            this._mappingNameToResolve = mappingName;
        }
    }, {
        key: '_resolve',
        value: function _resolve() {
            if (this._resolveAsValue) {
                return this._valueToResolve;
            } else if (this._resolveAsDependency) {
                return DependencyContainer.resolve(this._registrationNameToResolve, this._mappingNameToResolve);
            }
        }
    }]);

    return ParameterDetails;
}();

function isFunction(func) {
    return typeof func === 'function';
}

function getFunctionParameters(func) {
    var paramExtract = func.toString().match(/\s*function[^\(]*\(([^\)]*)\)/);
    if (paramExtract && paramExtract.length === 2) {
        return paramExtract[1].split(',').map(function (param) {
            return param.replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '').trim();
        });
    } else {
        throw new Error('Unable to fetch parameter details.');
    }
}

exports.DependencyContainer = DependencyContainer;
//# sourceMappingURL=dependency.js.map