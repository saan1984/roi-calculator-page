/*!
 * roi-calculator
 * 
 * Version: 0.0.1 - 2015-10-13T07:59:09.124Z
 * License: ISC
 */


'use strict';

var ptgDirectives = angular.module('ptg.directives',
    ['ngResource', 'ngSanitize', 'ui.bootstrap', 'rzModule']);

ptgDirectives.filter('notIntuitProductFilter', function () {
    return function (input) {
        var out = [];
        angular.forEach(input, function (obj, key) {
            if (angular.isDefined(obj.intuitProduct) && !obj.intuitProduct) {
                out.push(obj);
            }
        });
        return out;
    }
});

ptgDirectives.filter('otherFilter', function () {
    return function (input) {
        var isUndefined = angular.isUndefined(input)
        if (isUndefined) {
            return "Other";
        } else {
            return input;
        }
    }
});

ptgDirectives.controller("CalculatorController", function ($scope, $parse, $timeout,$interpolate) {
    //Handles changes in slider
    $scope.handleItemChange = function () {
        var newSliderValue = $scope.noOfRefund;
        $scope.fields.noRefundSlider.visible = true;
        if (newSliderValue == null) {
            $scope.noOfRefundS = 0;
            $scope.noOfRefund = 0;
        } else if (newSliderValue > $scope.fields.noRefundSlider.ceil) {
            $scope.fields.noRefundSlider.visible = false;
        } else {
            $scope.noOfRefundS = newSliderValue;
        }
        $scope.refreshSlider();
        $scope.applyFormulaes();
    };

    $scope.refreshSlider = function () {
        $timeout(function () {
            $scope.$broadcast('rzSliderForceRender');
        });
    };

    $scope.applyFormulaes = function () {
        var selectedBank = $scope.bank,
            selectedProduct = $scope.product,
            selectedNoRefund = $scope.noOfRefund,
            isValid = angular.isDefined(selectedBank) && selectedBank !== null
                && angular.isDefined(selectedProduct) && selectedProduct !== null
                && angular.isDefined(selectedNoRefund) && selectedNoRefund !== null;
        //All inputs are present, time to apply formulaes
        if (isValid) {
            angular.forEach($scope.formulaes, function (formulaObj, index) {
                var keyList = Object.keys(formulaObj),
                    theKey = keyList[0];
                angular.forEach(formulaObj, function (objValue, objKey) {
                    if (objKey != null) {
                        $parse(objKey).assign($scope.data, $parse(objValue)($scope));
                    }
                });
            });
        }
    };

    $scope.compileExpression = function (value) {
        if(angular.isDefined(value)){
            return $parse(value)($scope);
        }else{
            return false;
        }
    };

    //Watcher for noOfRefund
    $scope.$watch("noOfRefund", function (nValue, oValue) {
        if (nValue !== oValue) {
            $scope.handleItemChange();
        }
    });
});

ptgDirectives.directive('roiCalculator', function (DataService, $q) {
    return {
        restrict: 'E',
        templateUrl: 'directive.html',
        scope: {
            banksUrl: "@banksUrl",
            productUrl: "@productsUrl",
            fieldUrl: "@fieldsUrl",
            formulaeUrl: "@formulaeUrl",
            quoteUrl: "@quoteUrl"

        },
        controller: 'CalculatorController',
        replace: true,
        link: function (scope, element, attr) {
            var banksRequest = DataService.getBanksList(scope.banksUrl).$promise,
                productsRequest = DataService.getProductList(scope.productUrl).$promise,
                fieldsRequest = DataService.getFieldList(scope.fieldUrl).$promise,
                formulaeRequest = DataService.getFormulaeList(scope.formulaeUrl).$promise;

            $q.all([banksRequest, productsRequest,
                fieldsRequest, formulaeRequest
            ]).then(function (resData) {
                scope.banks = resData[0];
                scope.products = resData[1];
                scope.fields = resData[2];
                scope.formulaes = resData[3];
                scope.data = {};
                //Set Default Values for calculator inputs
                scope.noOfRefund = scope.fields.noRefundSlider.value;
                scope.applyFormulaes();
            });
        }
    };
});

ptgDirectives.service("DataService", function ($resource) {
    return {
        //Returns JSON Array of Bank Object
        getBanksList: function (banksUrl) {
            return $resource(banksUrl, {/* parameters*/}, {
                list: {
                    method: 'POST', isArray: false
                }
            }).get();
        },
        //Returns JSON Array of products Object
        getProductList: function (productsUrl) {
            return $resource(productsUrl, {/* parameters*/}, {
                list: {
                    method: 'POST', isArray: false
                }
            }).get();
        },
        //Returns JSON Object For Formulae List
        getFormulaeList: function (formulaeUrl) {
            return $resource(formulaeUrl, {/* parameters*/}, {
                list: {
                    method: 'POST', isArray: true
                }
            }).query();
        },
        //Returns JSON Object For Field List
        getFieldList: function (fieldUrl) {
            return $resource(fieldUrl, {/* parameters*/}, {
                list: {
                    method: 'POST', isArray: false
                }
            }).get();
        }
    }
});

angular.module("ptg.directives").run(["$templateCache", function($templateCache) {$templateCache.put("directive.html","<div class=\"widget-container\"><div class=\"row\"><div class=\"col-sm-12\"><div class=\"panel card ptg-header-section\"><div class=\"row\"><h1 class=\"text-center panel-heading hy-text-light\">{{fields.title}}</h1><h3 class=\"hy-text-light text-center text-primary roi-subtitle\">{{fields.subTitle}}</h3></div><div class=\"row ptg-vertical-gap\"><div class=\"col-sm-6\"><div class=\"form-group\"><label for=\"noRefTransfer\" class=\"hy-heading\">{{fields.noRefundSlider.label}}</label> <input type=\"number\" ng-model=\"noOfRefund\" ng-value=\"fields.noRefundSlider.value\" ng-change=\"handleItemChange()\" class=\"form-control hy-number\" min=\"{{fields.noRefundSlider.floor}}\" step=\"1\" id=\"noRefTransfer\"></div><div class=\"form-group\"><div class=\"slider-container\"><rzslider ng-show=\"fields.noRefundSlider.visible\" class=\"ptg-slider hy-number\" rz-slider-model=\"noOfRefund\" rz-slider-hide-limit-labels=\"false\" rz-slider-on-change=\"handleItemChange()\" rz-slider-floor=\"fields.noRefundSlider.floor\" rz-slider-ceil=\"fields.noRefundSlider.ceil\"></rzslider></div></div></div><div class=\"col-sm-6\"><div class=\"form-group\"><label for=\"provider\" class=\"control-label\">{{fields.product.label}}</label><select class=\"form-control\" ng-change=\"handleItemChange()\" id=\"provider\" ng-model=\"product\" ng-options=\"v.name for (k,v) in products| notIntuitProductFilter\"><option value=\"\">-Select-</option></select></div><div class=\"form-group\"><label for=\"bank\" class=\"control-label\">{{fields.bank.label}}</label><select class=\"form-control\" ng-change=\"handleItemChange()\" id=\"bank\" ng-model=\"bank\" ng-options=\"c.name for c in banks\"><option value=\"\">-Select-</option></select></div></div></div></div></div></div><div class=\"row\" ng-if=\"data.difference\"><div class=\"col-sm-6\"><h5 class=\"hy-text-light text-warning\" ng-bind-html=\"fields.productMessage\"></h5></div><div class=\"col-sm-3\"><a ng-href=\"{{quoteUrl}}\" class=\"btn btn-warning btn-block btn-lg hy-bg-orange3 quote-link\">Request Quote</a></div><div class=\"col-sm-3 text-center\"><h5 class=\"hy-text-light text-success profit-message\">You could profit by<br><span class=\"hy-number-light hy-number-lg\">{{data.difference | currency}}</span><br>using ProSeries.</h5></div></div><div class=\"row\"><div class=\"col-sm-6\"><div class=\"card panel\"><div class=\"card-header\"><h1 class=\"panel-heading hy-text-light product-name\">{{product.name | otherFilter}} Software</h1></div><table class=\"table\"><tbody><tr ng-repeat=\"aRow in fields.calculationOther\"><td>{{aRow.label}}</td><td class=\"text-danger hy-number-sm\">{{ compileExpression(aRow.model) | currency}}</td></tr></tbody><tfoot class=\"ptg-footer hy-bg-blue1\"><tr><td><strong>Total Cost For <span ng-if=\"data.totalOther\">{{noOfRefund}}</span> Returns</strong></td><td><strong class=\"hy-number-sm\">{{data.totalOther| currency}}</strong></td></tr></tfoot></table></div></div><div class=\"col-sm-6\"><div class=\"card panel\"><div class=\"card-header\"><h1 class=\"panel-heading hy-text-light text-left product-name\">ProSeries</h1></div><table class=\"table\"><tbody><tr ng-repeat=\"aRow in fields.calculationPro\"><td>{{aRow.label}}</td><td class=\"text-danger hy-number-sm\">{{ compileExpression(aRow.model) | currency}}</td></tr></tbody><tfoot class=\"ptg-footer hy-bg-blue1\"><tr><td><strong>Total Cost For <span ng-if=\"data.totalPro\">{{noOfRefund}}</span> Returns</strong></td><td><strong class=\"hy-number-sm\">{{data.totalPro | currency}}</strong></td></tr></tfoot></table></div></div></div></div>");}]);