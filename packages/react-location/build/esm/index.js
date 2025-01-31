/**
 * react-location
 *
 * Copyright (c) TanStack
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import * as React from 'react';
import { createBrowserHistory, createMemoryHistory } from 'history';
export { createBrowserHistory, createHashHistory, createMemoryHistory } from 'history';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

// @ts-nocheck
// We're inlining qss here for compression's sake, but we've included it as a hard dependency for the MIT license it requires.
function encode(obj, pfx) {
  var k,
      i,
      tmp,
      str = '';

  for (k in obj) {
    if ((tmp = obj[k]) !== void 0) {
      if (Array.isArray(tmp)) {
        for (i = 0; i < tmp.length; i++) {
          str && (str += '&');
          str += encodeURIComponent(k) + '=' + encodeURIComponent(tmp[i]);
        }
      } else {
        str && (str += '&');
        str += encodeURIComponent(k) + '=' + encodeURIComponent(tmp);
      }
    }
  }

  return (pfx || '') + str;
}

function toValue(mix) {
  if (!mix) return '';
  var str = decodeURIComponent(mix);
  if (str === 'false') return false;
  if (str === 'true') return true;
  return +str * 0 === 0 ? +str : str;
}

function decode(str) {
  var tmp,
      k,
      out = {},
      arr = str.split('&');

  while (tmp = arr.shift()) {
    tmp = tmp.split('=');
    k = tmp.shift();

    if (out[k] !== void 0) {
      out[k] = [].concat(out[k], toValue(tmp.shift()));
    } else {
      out[k] = toValue(tmp.shift());
    }
  }

  return out;
}

const _excluded = ["children", "location", "__experimental__snapshot"],
      _excluded2 = ["location", "__experimental__snapshot"],
      _excluded3 = ["basepath", "routes"],
      _excluded4 = ["to", "search", "hash", "children", "target", "style", "replace", "onClick", "onMouseEnter", "className", "getActiveProps", "getInactiveProps", "activeOptions", "preload", "disabled", "_ref"],
      _excluded5 = ["style", "className"],
      _excluded6 = ["style", "className"],
      _excluded7 = ["pending"],
      _excluded8 = ["children"];

// Source
const LocationContext = /*#__PURE__*/React.createContext(null);
const MatchesContext = /*#__PURE__*/React.createContext(null);
const RouterContext = /*#__PURE__*/React.createContext(null); // Detect if we're in the DOM

const isDOM = Boolean(typeof window !== 'undefined' && window.document && window.document.createElement);
const useLayoutEffect = isDOM ? React.useLayoutEffect : React.useEffect; // This is the default history object if none is defined

const createDefaultHistory = () => isDOM ? createBrowserHistory() : createMemoryHistory();

class Subscribable {
  constructor() {
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(x => x !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

}

class ReactLocation extends Subscribable {
  //
  constructor(options) {
    var _options$stringifySea, _options$parseSearch;

    super();
    this.isTransitioning = false;
    this.history = (options == null ? void 0 : options.history) || createDefaultHistory();
    this.stringifySearch = (_options$stringifySea = options == null ? void 0 : options.stringifySearch) != null ? _options$stringifySea : defaultStringifySearch;
    this.parseSearch = (_options$parseSearch = options == null ? void 0 : options.parseSearch) != null ? _options$parseSearch : defaultParseSearch;
    this.current = this.parseLocation(this.history.location);
    this.destroy = this.history.listen(event => {
      this.current = this.parseLocation(event.location, this.current);
      this.notify();
    });
  }

  buildNext(basepath, dest) {
    var _dest$to, _dest$__searchFilters, _functionalUpdate, _dest$__searchFilters2;

    if (basepath === void 0) {
      basepath = '/';
    }

    if (dest === void 0) {
      dest = {};
    }

    const from = _extends({}, this.current, dest.from);

    const pathname = resolvePath(basepath, from.pathname, "" + ((_dest$to = dest.to) != null ? _dest$to : '.'));
    const filteredSearch = (_dest$__searchFilters = dest.__searchFilters) != null && _dest$__searchFilters.length ? dest.__searchFilters.reduce((prev, next) => next(prev), from.search) : from.search;
    const updatedSearch = dest.search === true ? filteredSearch // Preserve from true
    : dest.search ? (_functionalUpdate = functionalUpdate(dest.search, filteredSearch)) != null ? _functionalUpdate : {} // Updater
    : (_dest$__searchFilters2 = dest.__searchFilters) != null && _dest$__searchFilters2.length ? filteredSearch // Preserve from filters
    : {};
    const search = replaceEqualDeep(from.search, updatedSearch);
    const searchStr = this.stringifySearch(search);
    let hash = dest.hash === true ? from.hash : functionalUpdate(dest.hash, from.hash);
    hash = hash ? "#" + hash : '';
    return {
      pathname,
      search,
      searchStr,
      hash,
      href: "" + pathname + searchStr + hash,
      key: dest.key
    };
  }

  navigate(next, replace) {
    this.current = next;
    if (this.navigateTimeout) clearTimeout(this.navigateTimeout);
    let nextAction = 'replace';

    if (!replace) {
      nextAction = 'push';
    }

    const isSameUrl = this.parseLocation(this.history.location).href === this.current.href;

    if (isSameUrl && !this.current.key) {
      nextAction = 'replace';
    }

    if (nextAction === 'replace') {
      return this.history.replace({
        pathname: this.current.pathname,
        hash: this.current.hash,
        search: this.current.searchStr
      });
    }

    return this.history.push({
      pathname: this.current.pathname,
      hash: this.current.hash,
      search: this.current.searchStr
    });
  }

  parseLocation(location, previousLocation) {
    var _location$hash$split$;

    const parsedSearch = this.parseSearch(location.search);
    return {
      pathname: location.pathname,
      searchStr: location.search,
      search: replaceEqualDeep(previousLocation == null ? void 0 : previousLocation.search, parsedSearch),
      hash: (_location$hash$split$ = location.hash.split('#').reverse()[0]) != null ? _location$hash$split$ : '',
      href: "" + location.pathname + location.search + location.hash,
      key: location.key
    };
  }

}
function MatchesProvider(props) {
  return /*#__PURE__*/React.createElement(MatchesContext.Provider, props);
}
function Router(_ref2) {
  let {
    children,
    location,
    __experimental__snapshot
  } = _ref2,
      rest = _objectWithoutPropertiesLoose(_ref2, _excluded);

  const routerRef = React.useRef(null);

  if (!routerRef.current) {
    routerRef.current = new RouterInstance({
      location,
      __experimental__snapshot,
      routes: rest.routes
    });
  }

  const router = routerRef.current;
  const [nonce, rerender] = React.useReducer(() => ({}), {});
  router.update(rest);
  useLayoutEffect(() => {
    return router.subscribe(() => {
      rerender();
    });
  }, []);
  useLayoutEffect(() => {
    return router.updateLocation(location.current).unsubscribe;
  }, [location.current.key]);
  return /*#__PURE__*/React.createElement(LocationContext.Provider, {
    value: {
      location
    }
  }, /*#__PURE__*/React.createElement(RouterContext.Provider, {
    value: {
      router
    }
  }, /*#__PURE__*/React.createElement(InitialSideEffects, null), /*#__PURE__*/React.createElement(MatchesProvider, {
    value: [router.rootMatch, ...router.state.matches]
  }, children != null ? children : /*#__PURE__*/React.createElement(Outlet, null))));
}

function InitialSideEffects() {
  const location = useLocation();
  const buildNext = useBuildNext();
  const navigate = useNavigate();
  useLayoutEffect(() => {
    const next = buildNext({
      to: '.',
      search: true,
      hash: true
    });

    if (next.href !== location.current.href) {
      navigate({
        to: '.',
        search: true,
        hash: true,
        fromCurrent: true,
        replace: true
      });
    }
  }, []);
  return null;
}

class RouterInstance extends Subscribable {
  constructor(_ref3) {
    var _experimental__snaps5;

    let {
      location,
      __experimental__snapshot
    } = _ref3,
        rest = _objectWithoutPropertiesLoose(_ref3, _excluded2);

    super();
    this.routesById = {};

    this.update = _ref4 => {
      let {
        basepath,
        routes
      } = _ref4,
          opts = _objectWithoutPropertiesLoose(_ref4, _excluded3);

      Object.assign(this, opts);
      this.basepath = cleanPath("/" + (basepath != null ? basepath : ''));
      this.routesById = {};

      const recurseRoutes = (routes, parent) => {
        return routes.map(route => {
          var _route$path, _route$pendingMs, _route$pendingMinMs, _route$children;

          const path = (_route$path = route.path) != null ? _route$path : '*';
          const id = joinPaths([(parent == null ? void 0 : parent.id) === 'root' ? '' : parent == null ? void 0 : parent.id, "" + (path == null ? void 0 : path.replace(/(.)\/$/, '$1')) + (route.id ? "-" + route.id : '')]);
          route = _extends({}, route, {
            pendingMs: (_route$pendingMs = route.pendingMs) != null ? _route$pendingMs : opts == null ? void 0 : opts.defaultPendingMs,
            pendingMinMs: (_route$pendingMinMs = route.pendingMinMs) != null ? _route$pendingMinMs : opts == null ? void 0 : opts.defaultPendingMinMs,
            id
          });

          if (this.routesById[id]) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn("Duplicate routes found with id: " + id, this.routesById, route);
            }

            throw new Error();
          }

          this.routesById[id] = route;
          route.children = (_route$children = route.children) != null && _route$children.length ? recurseRoutes(route.children, route) : undefined;
          return route;
        });
      };

      this.routes = recurseRoutes(routes);
      this.rootMatch = {
        id: 'root',
        params: {},
        search: {},
        pathname: this.basepath,
        route: null,
        ownData: {},
        data: {},
        isLoading: false,
        status: 'resolved'
      };
    };

    this.setState = updater => {
      const newState = updater({
        state: this.state,
        pending: this.pending
      });
      this.state = newState.state;
      this.pending = newState.pending;
      this.cleanMatchCache();
      this.notify();
    };

    this.matchCache = {};

    this.cleanMatchCache = () => {
      var _this$state$matches, _this$pending$matches, _this$pending;

      const activeMatchIds = [...((_this$state$matches = this == null ? void 0 : this.state.matches) != null ? _this$state$matches : []), ...((_this$pending$matches = this == null ? void 0 : (_this$pending = this.pending) == null ? void 0 : _this$pending.matches) != null ? _this$pending$matches : [])].map(d => d.id);
      Object.values(this.matchCache).forEach(match => {
        var _match$updatedAt;

        if (!match.updatedAt) {
          return;
        }

        if (activeMatchIds.includes(match.id)) {
          return;
        }

        const age = Date.now() - ((_match$updatedAt = match.updatedAt) != null ? _match$updatedAt : 0);

        if (!match.maxAge || age > match.maxAge) {
          if (match.route.unloader) {
            match.route.unloader(match);
          }

          delete this.matchCache[match.id];
        }
      });
    };

    this.updateLocation = next => {
      let unsubscribe;
      const promise = new Promise(resolve => {
        const matchLoader = new MatchLoader(this, next);
        this.setState(old => {
          return _extends({}, old, {
            pending: {
              location: matchLoader.location,
              matches: matchLoader.matches
            }
          });
        });
        unsubscribe = matchLoader.subscribe(() => {
          const currentMatches = this.state.matches;
          currentMatches.filter(d => {
            return !matchLoader.matches.find(dd => dd.id === d.id);
          }).forEach(d => {
            d.onExit == null ? void 0 : d.onExit(d);
          });
          currentMatches.filter(d => {
            return matchLoader.matches.find(dd => dd.id === d.id);
          }).forEach(d => {
            d.route.onTransition == null ? void 0 : d.route.onTransition(d);
          });
          matchLoader.matches.filter(d => {
            return !currentMatches.find(dd => dd.id === d.id);
          }).forEach(d => {
            d.onExit = d.route.onMatch == null ? void 0 : d.route.onMatch(d);
          });
          this.setState(old => {
            return _extends({}, old, {
              state: {
                location: matchLoader.location,
                matches: matchLoader.matches
              },
              pending: undefined
            });
          });
          resolve();
        });
        matchLoader.loadData();
        matchLoader.startPending();
      });
      return {
        promise,
        unsubscribe: unsubscribe
      };
    };

    this.__experimental__createSnapshot = () => {
      return {
        location: this.state.location,
        matches: this.state.matches.map(_ref5 => {
          let {
            ownData,
            id
          } = _ref5;
          return {
            id,
            ownData
          };
        })
      };
    };

    this.update(rest);
    let matches = [];

    if (__experimental__snapshot) {
      const matchLoader = new MatchLoader(this, location.current);
      matchLoader.matches.forEach((match, index) => {
        var _experimental__snaps, _experimental__snaps3, _experimental__snaps4;

        if (match.id !== ((_experimental__snaps = __experimental__snapshot.matches[index]) == null ? void 0 : _experimental__snaps.id)) {
          var _experimental__snaps2;

          throw new Error("Router hydration mismatch: " + match.id + " !== " + ((_experimental__snaps2 = __experimental__snapshot.matches[index]) == null ? void 0 : _experimental__snaps2.id));
        }

        match.ownData = (_experimental__snaps3 = (_experimental__snaps4 = __experimental__snapshot.matches[index]) == null ? void 0 : _experimental__snaps4.ownData) != null ? _experimental__snaps3 : {};
      });
      cascadeMatchData(matchLoader.matches);
      matches = matchLoader.matches;
    }

    this.state = {
      location: (_experimental__snaps5 = __experimental__snapshot == null ? void 0 : __experimental__snapshot.location) != null ? _experimental__snaps5 : location.current,
      matches: matches
    };
    location.subscribe(() => this.notify());
  }

}
function useLocation() {
  const context = React.useContext(LocationContext);
  warning(!!context, 'useLocation must be used within a <ReactLocation />');
  return context.location;
}
class RouteMatch {
  constructor(unloadedMatch) {
    this.status = 'loading';
    this.ownData = {};
    this.data = {};
    this.isLoading = false;

    this.notify = isSoft => {
      var _this$matchLoader;

      (_this$matchLoader = this.matchLoader) == null ? void 0 : _this$matchLoader.preNotify(isSoft ? this : undefined);
    };

    this.assignMatchLoader = matchLoader => {
      this.matchLoader = matchLoader;
    };

    this.startPending = () => {
      if (this.pendingTimeout) {
        clearTimeout(this.pendingTimeout);
      }

      if (this.route.pendingMs !== undefined) {
        this.pendingTimeout = setTimeout(() => {
          var _this$notify;

          if (this.status === 'loading') {
            this.status = 'pending';
          }

          (_this$notify = this.notify) == null ? void 0 : _this$notify.call(this);

          if (typeof this.route.pendingMinMs !== 'undefined') {
            this.pendingMinPromise = new Promise(r => setTimeout(r, this.route.pendingMinMs));
          }
        }, this.route.pendingMs);
      }
    };

    this.load = opts => {
      var _ref6, _opts$maxAge;

      this.maxAge = (_ref6 = (_opts$maxAge = opts.maxAge) != null ? _opts$maxAge : this.route.loaderMaxAge) != null ? _ref6 : opts.router.defaultLoaderMaxAge;

      if (this.loaderPromise) {
        return;
      }

      const importer = this.route.import; // First, run any importers

      this.loaderPromise = (!importer ? Promise.resolve() : (() => {
        this.isLoading = true;
        return importer({
          params: this.params,
          search: this.search
        }).then(imported => {
          this.route = _extends({}, this.route, imported);
        });
      })() // then run all element and data loaders in parallel
      ).then(() => {
        const elementPromises = []; // For each element type, potentially load it asynchronously

        const elementTypes = ['element', 'errorElement', 'pendingElement'];
        elementTypes.forEach(type => {
          const routeElement = this.route[type];

          if (this[type]) {
            return;
          }

          if (typeof routeElement === 'function') {
            this.isLoading = true;
            elementPromises.push(routeElement(this).then(res => {
              this[type] = res;
            }));
          } else {
            this[type] = this.route[type];
          }
        });
        const loader = this.route.loader;
        const dataPromise = !loader ? Promise.resolve() : new Promise(async resolveLoader => {
          this.isLoading = true;

          const loaderReady = status => {
            this.updatedAt = Date.now();
            resolveLoader(this.ownData);
            this.status = status;
          };

          const resolve = data => {
            this.ownData = data;
            this.error = undefined;
            loaderReady('resolved');
          };

          const reject = err => {
            console.error(err);
            this.error = err;
            loaderReady('rejected');
          };

          try {
            resolve(await loader(this, {
              parentMatch: opts.parentMatch,
              dispatch: async event => {
                var _this$notify2;

                if (event.type === 'resolve') {
                  resolve(event.data);
                } else if (event.type === 'reject') {
                  reject(event.error);
                } else if (event.type === 'loading') {
                  this.isLoading = true;
                } else if (event.type === 'maxAge') {
                  this.maxAge = event.maxAge;
                }

                this.updatedAt = Date.now();
                (_this$notify2 = this.notify) == null ? void 0 : _this$notify2.call(this, true);
              }
            }));
          } catch (err) {
            reject(err);
          }
        });
        return Promise.all([...elementPromises, dataPromise]).then(() => {
          this.status = 'resolved';
          this.isLoading = false;
          this.startPending = undefined;
        }).then(() => this.pendingMinPromise).then(() => {
          var _this$notify3;

          if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
          }

          (_this$notify3 = this.notify) == null ? void 0 : _this$notify3.call(this, true);
        });
      }).then(() => {
        return this.ownData;
      });
    };

    Object.assign(this, unloadedMatch);
  }

}

class MatchLoader extends Subscribable {
  constructor(router, nextLocation) {
    var _this;

    super();
    _this = this;
    this.preNotifiedMatches = [];
    this.status = 'pending';

    this.preNotify = routeMatch => {
      if (routeMatch) {
        if (!this.preNotifiedMatches.includes(routeMatch)) {
          this.preNotifiedMatches.push(routeMatch);
        }
      }

      if (!routeMatch || this.preNotifiedMatches.length === this.matches.length) {
        this.status = 'resolved';
        cascadeMatchData(this.matches);
        this.notify();
      }
    };

    this.loadData = async function (_temp) {
      var _this$matches;

      let {
        maxAge
      } = _temp === void 0 ? {} : _temp;

      _this.router.cleanMatchCache();

      if (!((_this$matches = _this.matches) != null && _this$matches.length)) {
        _this.preNotify();

        return;
      }

      _this.firstRenderPromises = [];

      _this.matches.forEach((match, index) => {
        var _this$matches2, _this$firstRenderProm;

        const parentMatch = (_this$matches2 = _this.matches) == null ? void 0 : _this$matches2[index - 1];
        match.assignMatchLoader == null ? void 0 : match.assignMatchLoader(_this);
        match.load == null ? void 0 : match.load({
          maxAge,
          parentMatch,
          router: _this.router
        });
        (_this$firstRenderProm = _this.firstRenderPromises) == null ? void 0 : _this$firstRenderProm.push(match.loaderPromise);
      });

      return await Promise.all(_this.firstRenderPromises).then(() => {
        _this.preNotify();

        return _this.matches;
      });
    };

    this.load = async function (_temp2) {
      let {
        maxAge
      } = _temp2 === void 0 ? {} : _temp2;
      return await _this.loadData({
        maxAge
      });
    };

    this.startPending = async () => {
      this.matches.forEach(match => match.startPending == null ? void 0 : match.startPending());
    };

    this.router = router;
    this.location = nextLocation;
    this.matches = [];
    const unloadedMatches = matchRoutes(this.router, this.location);
    this.matches = unloadedMatches == null ? void 0 : unloadedMatches.map(unloadedMatch => {
      if (!this.router.matchCache[unloadedMatch.id]) {
        this.router.matchCache[unloadedMatch.id] = new RouteMatch(unloadedMatch);
      }

      return this.router.matchCache[unloadedMatch.id];
    });
  }

}

function cascadeMatchData(matches) {
  matches == null ? void 0 : matches.forEach((match, index) => {
    var _parentMatch$data;

    const parentMatch = matches == null ? void 0 : matches[index - 1];
    match.data = _extends({}, (_parentMatch$data = parentMatch == null ? void 0 : parentMatch.data) != null ? _parentMatch$data : {}, match.ownData);
  });
}

function useRouter() {
  const value = React.useContext(RouterContext);

  if (!value) {
    warning(true, 'You are trying to use useRouter() outside of ReactLocation!');
    throw new Error();
  }

  return value.router;
}
function matchRoutes(router, currentLocation) {
  if (!router.routes.length) {
    return [];
  }

  const matches = [];

  const recurse = async (routes, parentMatch) => {
    var _route$children3;

    let {
      pathname,
      params
    } = parentMatch;
    const filteredRoutes = router != null && router.filterRoutes ? router == null ? void 0 : router.filterRoutes(routes) : routes;
    const route = filteredRoutes.find(route => {
      var _route$children2, _route$caseSensitive;

      const fullRoutePathName = joinPaths([pathname, route.path]);
      const fuzzy = !!(route.path !== '/' || (_route$children2 = route.children) != null && _route$children2.length);
      const matchParams = matchRoute(currentLocation, {
        to: fullRoutePathName,
        search: route.search,
        fuzzy,
        caseSensitive: (_route$caseSensitive = route.caseSensitive) != null ? _route$caseSensitive : router.caseSensitive
      });

      if (matchParams) {
        params = _extends({}, params, matchParams);
      }

      return !!matchParams;
    });

    if (!route) {
      return;
    }

    const interpolatedPath = interpolatePath(route.path, params);
    pathname = joinPaths([pathname, interpolatedPath]);
    const interpolatedId = interpolatePath(route.id, params, true);
    const match = {
      id: interpolatedId,
      route,
      params,
      pathname,
      search: currentLocation.search
    };
    matches.push(match);

    if ((_route$children3 = route.children) != null && _route$children3.length) {
      recurse(route.children, match);
    }
  };

  recurse(router.routes, router.rootMatch);
  return matches;
}

function interpolatePath(path, params, leaveWildcard) {
  const interpolatedPathSegments = parsePathname(path);
  return joinPaths(interpolatedPathSegments.map(segment => {
    if (segment.value === '*' && !leaveWildcard) {
      return '';
    }

    if (segment.type === 'param') {
      var _segment$value$substr;

      return (_segment$value$substr = params[segment.value.substring(1)]) != null ? _segment$value$substr : '';
    }

    return segment.value;
  }));
}

function useLoadRoute() {
  const location = useLocation();
  const match = useMatch();
  const router = useRouter();
  const buildNext = useBuildNext();
  return useLatestCallback(async function (navigate, opts) {
    var _navigate$from;

    if (navigate === void 0) {
      navigate = location.current;
    }

    const next = buildNext(_extends({}, navigate, {
      from: (_navigate$from = navigate.from) != null ? _navigate$from : {
        pathname: match.pathname
      }
    }));
    const matchLoader = new MatchLoader(router, next);
    return await matchLoader.load(opts);
  });
}
function useParentMatches() {
  const router = useRouter();
  const match = useMatch();
  const matches = router.state.matches;
  return matches.slice(0, matches.findIndex(d => d.id === match.id) - 1);
}
function useMatches() {
  return React.useContext(MatchesContext);
}
function useMatch() {
  var _useMatches;

  return (_useMatches = useMatches()) == null ? void 0 : _useMatches[0];
}
function useNavigate() {
  const location = useLocation();
  const match = useMatch();
  const buildNext = useBuildNext();

  function navigate(_ref7) {
    var _fromCurrent;

    let {
      search,
      hash,
      replace,
      from,
      to,
      fromCurrent
    } = _ref7;
    fromCurrent = (_fromCurrent = fromCurrent) != null ? _fromCurrent : typeof to === 'undefined';
    const next = buildNext({
      to,
      search,
      hash,
      from: fromCurrent ? location.current : from != null ? from : {
        pathname: match.pathname
      }
    });
    location.navigate(next, replace);
  }

  return useLatestCallback(navigate);
}
function Navigate(options) {
  let navigate = useNavigate();
  useLayoutEffect(() => {
    navigate(options);
  }, [navigate]);
  return null;
}

function useBuildNext() {
  const location = useLocation();
  const router = useRouter();

  const buildNext = opts => {
    const next = location.buildNext(router.basepath, opts);
    const matches = matchRoutes(router, next);

    const __searchFilters = matches.map(match => {
      var _match$route$searchFi;

      return (_match$route$searchFi = match.route.searchFilters) != null ? _match$route$searchFi : [];
    }).flat().filter(Boolean);

    return location.buildNext(router.basepath, _extends({}, opts, {
      __searchFilters
    }));
  };

  return useLatestCallback(buildNext);
}

const Link = function Link(_ref8) {
  var _preload;

  let {
    to = '.',
    search,
    hash,
    children,
    target,
    style = {},
    replace,
    onClick,
    onMouseEnter,
    className = '',
    getActiveProps = () => ({
      className: 'active'
    }),
    getInactiveProps = () => ({}),
    activeOptions,
    preload,
    disabled,
    _ref
  } = _ref8,
      rest = _objectWithoutPropertiesLoose(_ref8, _excluded4);

  const loadRoute = useLoadRoute();
  const match = useMatch();
  const location = useLocation();
  const router = useRouter();
  const navigate = useNavigate();
  const buildNext = useBuildNext();
  preload = (_preload = preload) != null ? _preload : router.defaultLinkPreloadMaxAge; // If this `to` is a valid external URL, log a warning

  try {
    const url = new URL("" + to);
    warning(false, "<Link /> should not be used for external URLs like: " + url.href);
  } catch (e) {}

  const next = buildNext({
    to,
    search,
    hash,
    from: {
      pathname: match.pathname
    }
  }); // The click handler

  const handleClick = e => {
    if (disabled) return;
    if (onClick) onClick(e);

    if (!isCtrlEvent(e) && !e.defaultPrevented && (!target || target === '_self') && e.button === 0) {
      e.preventDefault(); // All is well? Navigate!

      navigate({
        to,
        search,
        hash,
        replace,
        from: {
          pathname: match.pathname
        }
      });
    }
  }; // The click handler


  const handleMouseEnter = e => {
    if (onMouseEnter) onMouseEnter(e);

    if (preload && preload > 0) {
      loadRoute({
        to,
        search,
        hash
      }, {
        maxAge: preload
      });
    }
  }; // Compare path/hash for matches


  const pathIsEqual = location.current.pathname === next.pathname;
  const currentPathSplit = location.current.pathname.split('/');
  const nextPathSplit = next.pathname.split('/');
  const pathIsFuzzyEqual = nextPathSplit.every((d, i) => d === currentPathSplit[i]);
  const hashIsEqual = location.current.hash === next.hash; // Combine the matches based on user options

  const pathTest = activeOptions != null && activeOptions.exact ? pathIsEqual : pathIsFuzzyEqual;
  const hashTest = activeOptions != null && activeOptions.includeHash ? hashIsEqual : true; // The final "active" test

  const isActive = pathTest && hashTest; // Get the active props

  const _ref9 = isActive ? getActiveProps() : {},
        {
    style: activeStyle = {},
    className: activeClassName = ''
  } = _ref9,
        activeRest = _objectWithoutPropertiesLoose(_ref9, _excluded5); // Get the inactive props


  const _ref10 = isActive ? {} : getInactiveProps(),
        {
    style: inactiveStyle = {},
    className: inactiveClassName = ''
  } = _ref10,
        inactiveRest = _objectWithoutPropertiesLoose(_ref10, _excluded6);

  return /*#__PURE__*/React.createElement("a", _extends({
    ref: _ref,
    href: disabled ? undefined : next.href,
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    target,
    style: _extends({}, style, activeStyle, inactiveStyle),
    className: [className, activeClassName, inactiveClassName].filter(Boolean).join(' ') || undefined
  }, disabled ? {
    role: 'link',
    'aria-disabled': true
  } : undefined, rest, activeRest, inactiveRest, {
    children: typeof children === 'function' ? children({
      isActive
    }) : children
  }));
};
function Outlet() {
  var _match$errorElement;

  const router = useRouter();
  const [_, ...matches] = useMatches();
  const match = matches[0];

  if (!match) {
    return null;
  }

  const errorElement = (_match$errorElement = match.errorElement) != null ? _match$errorElement : router.defaultErrorElement;

  const element = (() => {
    var _match$pendingElement, _match$element;

    if (match.status === 'rejected') {
      if (errorElement) {
        return errorElement;
      }

      if (!router.useErrorBoundary) {
        if (process.env.NODE_ENV !== 'production') {
          const preStyle = {
            whiteSpace: 'normal',
            display: 'inline-block',
            background: 'rgba(0,0,0,.1)',
            padding: '.1rem .2rem',
            margin: '.1rem',
            lineHeight: '1',
            borderRadius: '.25rem'
          };
          return /*#__PURE__*/React.createElement("div", {
            style: {
              lineHeight: '1.7'
            }
          }, /*#__PURE__*/React.createElement("strong", null, "The following error occured in the loader for you route at:", ' ', /*#__PURE__*/React.createElement("pre", {
            style: preStyle
          }, match.pathname)), ".", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("pre", {
            style: _extends({}, preStyle, {
              display: 'block',
              padding: '.5rem',
              borderRadius: '.5rem'
            })
          }, match.error.toString()), /*#__PURE__*/React.createElement("br", null), "Your users won't see this message in production, but they will see", ' ', /*#__PURE__*/React.createElement("strong", null, "\"An unknown error occured!\""), ", which is at least better than breaking your entire app. \uD83D\uDE0A For a better UX, please specify an ", /*#__PURE__*/React.createElement("pre", {
            style: preStyle
          }, "errorElement"), " for all of your routes that contain asynchronous behavior, or at least provide your own", /*#__PURE__*/React.createElement("pre", {
            style: preStyle
          }, "ErrorBoundary"), " wrapper around your renders to both the elements rendered by", ' ', /*#__PURE__*/React.createElement("pre", {
            style: preStyle
          }, 'useRoutes(routes, { useErrorBoundary: true })'), ' ', "and ", /*#__PURE__*/React.createElement("pre", {
            style: preStyle
          }, '<Router useErrorBoundary />'), ".", ' ', /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null));
        }

        return 'An unknown error occured!';
      }

      throw match.error;
    }

    const pendingElement = (_match$pendingElement = match.pendingElement) != null ? _match$pendingElement : router.defaultPendingElement;

    if (match.status === 'loading') {
      return null;
    }

    if (match.status === 'pending') {
      if (match.route.pendingMs || pendingElement) {
        return pendingElement != null ? pendingElement : null;
      }
    }

    const matchElement = (_match$element = match.element) != null ? _match$element : router.defaultElement;
    return matchElement != null ? matchElement : /*#__PURE__*/React.createElement(Outlet, null);
  })();

  return /*#__PURE__*/React.createElement(MatchesProvider, {
    value: matches
  }, element);
}
function useResolvePath() {
  const router = useRouter();
  const match = useMatch();
  return useLatestCallback(path => resolvePath(router.basepath, match.pathname, cleanPath(path)));
}
function useSearch() {
  const location = useLocation();
  return location.current.search;
}
function matchRoute(currentLocation, matchLocation) {
  const pathParams = matchByPath(currentLocation, matchLocation);
  const searchMatched = matchBySearch(currentLocation, matchLocation);

  if (matchLocation.to && !pathParams) {
    return;
  }

  if (matchLocation.search && !searchMatched) {
    return;
  }

  return pathParams != null ? pathParams : {};
}
function useMatchRoute() {
  const router = useRouter();
  const resolvePath = useResolvePath();
  return useLatestCallback(_ref11 => {
    let {
      pending
    } = _ref11,
        matchLocation = _objectWithoutPropertiesLoose(_ref11, _excluded7);

    matchLocation = _extends({}, matchLocation, {
      to: matchLocation.to ? resolvePath("" + matchLocation.to) : undefined
    });

    if (pending) {
      var _router$pending;

      if (!((_router$pending = router.pending) != null && _router$pending.location)) {
        return undefined;
      }

      return matchRoute(router.pending.location, matchLocation);
    }

    return matchRoute(router.state.location, matchLocation);
  });
}
function MatchRoute(_ref12) {
  let {
    children
  } = _ref12,
      rest = _objectWithoutPropertiesLoose(_ref12, _excluded8);

  const matchRoute = useMatchRoute();
  const match = matchRoute(rest);

  if (typeof children === 'function') {
    return children(match);
  }

  return match ? children : null;
}
function usePrompt(message, when) {
  const location = useLocation();
  React.useEffect(() => {
    if (!when) return;
    let unblock = location.history.block(transition => {
      if (window.confirm(message)) {
        unblock();
        transition.retry();
      } else {
        location.current.pathname = window.location.pathname;
      }
    });
    return unblock;
  }, [when, location, message]);
}
function Prompt(_ref13) {
  let {
    message,
    when,
    children
  } = _ref13;
  usePrompt(message, when != null ? when : true);
  return children != null ? children : null;
}

function warning(cond, message) {
  if (!cond) {
    if (typeof console !== 'undefined') console.warn(message);

    try {
      throw new Error(message);
    } catch (_unused) {}
  }
}

function isFunction(d) {
  return typeof d === 'function';
}

function functionalUpdate(updater, previous) {
  if (isFunction(updater)) {
    return updater(previous);
  }

  return updater;
}

function joinPaths(paths) {
  return cleanPath(paths.filter(Boolean).join('/'));
}

function cleanPath(path) {
  // remove double slashes
  return ("" + path).replace(/\/{2,}/g, '/');
}
function matchByPath(currentLocation, matchLocation) {
  var _matchLocation$to;

  const baseSegments = parsePathname(currentLocation.pathname);
  const routeSegments = parsePathname("" + ((_matchLocation$to = matchLocation.to) != null ? _matchLocation$to : '*'));
  const params = {};

  let isMatch = (() => {
    for (let i = 0; i < Math.max(baseSegments.length, routeSegments.length); i++) {
      const baseSegment = baseSegments[i];
      const routeSegment = routeSegments[i];
      const isLastRouteSegment = i === routeSegments.length - 1;
      const isLastBaseSegment = i === baseSegments.length - 1;

      if (routeSegment) {
        if (routeSegment.type === 'wildcard') {
          if (baseSegment != null && baseSegment.value) {
            params['*'] = joinPaths(baseSegments.slice(i).map(d => d.value));
            return true;
          }

          return false;
        }

        if (routeSegment.type === 'pathname') {
          if (routeSegment.value === '/' && !(baseSegment != null && baseSegment.value)) {
            return true;
          }

          if (baseSegment) {
            if (matchLocation.caseSensitive) {
              if (routeSegment.value !== baseSegment.value) {
                return false;
              }
            } else if (routeSegment.value.toLowerCase() !== baseSegment.value.toLowerCase()) {
              return false;
            }
          }
        }

        if (!baseSegment) {
          return false;
        }

        if (routeSegment.type === 'param') {
          params[routeSegment.value.substring(1)] = baseSegment.value;
        }
      }

      if (isLastRouteSegment && !isLastBaseSegment) {
        return !!matchLocation.fuzzy;
      }
    }

    return true;
  })();

  return isMatch ? params : undefined;
}

function matchBySearch(currentLocation, matchLocation) {
  return !!(matchLocation.search && matchLocation.search(currentLocation.search));
}

function parsePathname(pathname) {
  if (!pathname) {
    return [];
  }

  pathname = cleanPath(pathname);
  const segments = [];

  if (pathname.slice(0, 1) === '/') {
    pathname = pathname.substring(1);
    segments.push({
      type: 'pathname',
      value: '/'
    });
  }

  if (!pathname) {
    return segments;
  } // Remove empty segments and '.' segments


  const split = pathname.split('/').filter(Boolean);
  segments.push(...split.map(part => {
    if (part.startsWith('*')) {
      return {
        type: 'wildcard',
        value: part
      };
    }

    if (part.charAt(0) === ':') {
      return {
        type: 'param',
        value: part
      };
    }

    return {
      type: 'pathname',
      value: part
    };
  }));

  if (pathname.slice(-1) === '/') {
    pathname = pathname.substring(1);
    segments.push({
      type: 'pathname',
      value: '/'
    });
  }

  return segments;
}
function resolvePath(basepath, base, to) {
  base = base.replace(new RegExp("^" + basepath), '/');
  to = to.replace(new RegExp("^" + basepath), '/');
  let baseSegments = parsePathname(base);
  const toSegments = parsePathname(to);
  toSegments.forEach((toSegment, index) => {
    if (toSegment.value === '/') {
      if (!index) {
        // Leading slash
        baseSegments = [toSegment];
      } else if (index === toSegments.length - 1) {
        // Trailing Slash
        baseSegments.push(toSegment);
      } else ;
    } else if (toSegment.value === '..') {
      baseSegments.pop();
    } else if (toSegment.value === '.') {
      return;
    } else {
      baseSegments.push(toSegment);
    }
  });
  const joined = joinPaths([basepath, ...baseSegments.map(d => d.value)]);
  return cleanPath(joined);
}

function isCtrlEvent(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}

function useLatestCallback(cb) {
  const stableFnRef = React.useRef();
  const cbRef = React.useRef(cb);
  cbRef.current = cb;

  if (!stableFnRef.current) {
    stableFnRef.current = function () {
      return cbRef.current(...arguments);
    };
  }

  return stableFnRef.current;
}
/**
 * This function returns `a` if `b` is deeply equal.
 * If not, it will replace any deeply equal children of `b` with those of `a`.
 * This can be used for structural sharing between JSON values for example.
 */


function replaceEqualDeep(prev, next) {
  if (prev === next) {
    return prev;
  }

  const array = Array.isArray(prev) && Array.isArray(next);

  if (array || isPlainObject(prev) && isPlainObject(next)) {
    const aSize = array ? prev.length : Object.keys(prev).length;
    const bItems = array ? next : Object.keys(next);
    const bSize = bItems.length;
    const copy = array ? [] : {};
    let equalItems = 0;

    for (let i = 0; i < bSize; i++) {
      const key = array ? i : bItems[i];
      copy[key] = replaceEqualDeep(prev[key], next[key]);

      if (copy[key] === prev[key]) {
        equalItems++;
      }
    }

    return aSize === bSize && equalItems === aSize ? prev : copy;
  }

  return next;
} // Copied from: https://github.com/jonschlinkert/is-plain-object


function isPlainObject(o) {
  if (!hasObjectPrototype(o)) {
    return false;
  } // If has modified constructor


  const ctor = o.constructor;

  if (typeof ctor === 'undefined') {
    return true;
  } // If has modified prototype


  const prot = ctor.prototype;

  if (!hasObjectPrototype(prot)) {
    return false;
  } // If constructor does not have an Object-specific method


  if (!prot.hasOwnProperty('isPrototypeOf')) {
    return false;
  } // Most likely a plain Object


  return true;
}

function hasObjectPrototype(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

const defaultParseSearch = parseSearchWith(JSON.parse);
const defaultStringifySearch = stringifySearchWith(JSON.stringify);
function parseSearchWith(parser) {
  return searchStr => {
    if (searchStr.substring(0, 1) === '?') {
      searchStr = searchStr.substring(1);
    }

    let query = decode(searchStr); // Try to parse any query params that might be json

    for (let key in query) {
      const value = query[key];

      if (typeof value === 'string') {
        try {
          query[key] = parser(value);
        } catch (err) {//
        }
      }
    }

    return query;
  };
}
function stringifySearchWith(stringify) {
  return search => {
    search = _extends({}, search);

    if (search) {
      Object.keys(search).forEach(key => {
        const val = search[key];

        if (typeof val === 'undefined' || val === undefined) {
          delete search[key];
        } else if (val && typeof val === 'object' && val !== null) {
          try {
            search[key] = stringify(val);
          } catch (err) {// silent
          }
        }
      });
    }

    const searchStr = encode(search).toString();
    return searchStr ? "?" + searchStr : '';
  };
}

export { Link, LocationContext, MatchRoute, MatchesContext, MatchesProvider, Navigate, Outlet, Prompt, ReactLocation, RouteMatch, Router, RouterContext, RouterInstance, cleanPath, defaultParseSearch, defaultStringifySearch, functionalUpdate, matchByPath, matchRoute, matchRoutes, parsePathname, parseSearchWith, resolvePath, stringifySearchWith, useLoadRoute, useLocation, useMatch, useMatchRoute, useMatches, useNavigate, useParentMatches, usePrompt, useResolvePath, useRouter, useSearch };
//# sourceMappingURL=index.js.map
