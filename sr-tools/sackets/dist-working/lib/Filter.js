"use strict";
// export var _filters = true; // hack to prevent output from being empty
var Filter = (function () {
    function Filter() {
    }
    Filter.sortResults = function (res, property, desc) {
        if (desc === void 0) { desc = false; }
        var results = res.slice(0);
        results.sort(function (a, b) {
            var x = a[property];
            var y = b[property];
            if (typeof x == 'string' && typeof y == 'string') {
                x = x.toLowerCase();
                y = y.toLowerCase();
            }
            return x < y ? -1 : x > y ? 1 : 0;
            // return a.born - b.born;
        });
        return results;
    };
    return Filter;
}());
exports.Filter = Filter;
//# sourceMappingURL=Filter.js.map