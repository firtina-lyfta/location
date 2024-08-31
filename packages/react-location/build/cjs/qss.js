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
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

exports.decode = decode;
exports.encode = encode;
//# sourceMappingURL=qss.js.map