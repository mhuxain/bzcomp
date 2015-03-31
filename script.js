'use strict';

var bzApp = bzApp || {};
bzApp.helpers = bzApp.helpers || {};

bzApp.helpers.appendFields = function (appendFields) {

  var fieldsStringArray = appendFields.split(",");
  var fieldsObj = {};

  angular.forEach(fieldsStringArray, function(value, key) {

      var fieldArray = value.split(":");
      var fieldKey = fieldArray[0].trim();
      var fieldValue = (isNaN(fieldArray[1]) ? fieldArray[1] : parseInt(fieldArray[1]));

      fieldsObj[fieldKey] = fieldValue;
    }, fieldsObj);

  return fieldsObj; 

};


(function(angular) {
  'use strict';

// angular.module('bz.helpers',[]).factory('bzHelpers', bzApp.helpers.appendFields);

angular.module('bz.comp', ['ui.bootstrap', 'ngSanitize','ui.select', 'ngResource'])

  .filter('propsFilter', function() {
    return function(items, props) {
      var out = [];
  
      if (angular.isArray(items)) {
        items.forEach(function(item) {
          var itemMatches = false;
  
          var keys = Object.keys(props);
          for (var i = 0; i < keys.length; i++) {
            var prop = keys[i];
            var text = props[prop].toLowerCase();
            if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
              itemMatches = true;
              break;
            }
          }
  
          if (itemMatches) {
            out.push(item);
          }
        });
      } else {
        // Let the output be the input untouched
        out = items;
      }
  
      return out;
    }
  })

  .directive('bzGrid', ['$modal', '$resource', '$http', function(modal, $resource, $http) {
    return {
      restrict: 'E',
      scope: {
        items: '=gridData',
        title: '@',
        formTemplate: '@',
        formFields: '=',
        gridUrl: '@',
        appendFields: '@'
      },
      controller : function () {

        
        // console.log($resource);

        var dd = this;

        
        if(dd.gridUrl == undefined ) {
          throw new Error('No grid URL, a grid URL must be defined in grid element');
        }
        
        // dd.items = dd.itemsRaw;
        
        // dd.gridUrl = dd.gridUrl || "/";

        function queryErrorHandler(resp) {

          console.log(resp);

        };


        dd.loadItems = function () {

          var query = $http.get(dd.gridUrl);

          query.then(function success(resp) {

            angular.copy(resp.data, dd.items);
              
            // dd.items = resp.data;

          });

          query.catch(queryErrorHandler);

        }

        dd.loadItems();


        var appendFieldsObj = (dd.appendFields ? bzApp.helpers.appendFields(dd.appendFields) : {});

        dd.addItem = function (form) {

          angular.extend(form, appendFieldsObj);

          var query = $http.post(dd.gridUrl, form);

          query.then(function success(resp) {
              
            dd.items.push(resp.data);

          });

          query.catch(queryErrorHandler);


        };
        
        dd.editItem = function (id, form) {

          angular.extend(form, appendFieldsObj);

          var putUrl = dd.gridUrl + "/" + id;

          var query = $http.put(putUrl, form);

          query.then(function success(resp) {
              
            dd.items[dd.itemToEditIndex] = resp.data;

            console.log(resp);

          });

          query.catch(queryErrorHandler);

          dd.itemToEdit = null;

          console.log(form);
          console.log(dd.items[dd.itemToEditIndex]);
          
        };

        
        dd.deleteItem = function (id, index) {

          var delUrl = dd.gridUrl + "/" + id;
          console.log(delUrl);

          var query = $http.delete(delUrl);

          query.then(function success(resp) {

            dd.items.splice(index, 1);

            console.info("Deleted item " + id + ", status:" + resp.status);

          });

          query.catch(queryErrorHandler);

          
        }


        dd.edit = function (id, itemToEdit, index) {

          console.log(index);
          
          dd.itemToEdit = itemToEdit;
          dd.itemToEditIndex = index;
          dd.itemToEditId = id;

          dd.open();

        };


        
        dd.open = function () {
          
          var modalInstance = modal.open({
            templateUrl: dd.formTemplate,
            controller: 'ModalInstanceCtrl',
            resolve: {
              dd: function () {
                return dd;
              }
            }
          });
      
        };

        
      },
      controllerAs: 'dd',
      bindToController: true,
      templateUrl: function (el, attrs) {
        
        return attrs.ddTemplate; }
    };
  }])

  .controller('ModalInstanceCtrl', ['dd', '$scope', '$modalInstance', 
  function (dd, scope, modalInstance) {


    
    scope.dd = dd;
    
    scope.form = angular.copy(dd.itemToEdit) || {};
  
    scope.ok = function (form) {
      
      console.log(form.customer);
      
      if(dd.itemToEdit) {
        
        dd.editItem(dd.itemToEditId, form);
        
      } else {
        dd.addItem(form);
        
      }
      
      modalInstance.close();
    };
  
    scope.cancel = function () {
      scope.form = {};
      dd.itemToEdit = null;
      modalInstance.dismiss('cancel');
      
    };
  }])

  .directive("dateField", function(){
  
    Date.prototype.toBasicDateString = function() {
     var yyyy = this.getFullYear().toString();
     var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
     var dd  = this.getDate().toString();
     return yyyy + "-" +(mm[1]?mm:"0"+mm[0]) + "-" +(dd[1]?dd:"0"+dd[0]); // padding
    };
    
    
    return {
      restrict: "E",
      scope:{
        dtStr: "=ngModel", 
        dateOptions: "=",
        label: "@"

      },
      controller: function () {

        var dp = this;

        if(dp.dtStr) {
          console.log("date string");
          var initDate = new Date(dp.dtStr);
          dp.dt = initDate.toBasicDateString();
        }
        

        dp.updateDate = function () {
          if(dp.dt instanceof Date) {
            
            // console.log("originalDate in UTC format: " + dp.dt.toUTCString());
            dp.dtStr = dp.dt.toBasicDateString();
            // console.log("final date as a basic string: " + dp.dt.toBasicDateString());
            dp.dateInvalid = false;
            
          } else {
            dp.dtStr = null;
            dp.dateInvalid = true;
          }
          
          console.log(dp.dt);

          
        }
        
        dp.open = function(event){
          event.preventDefault();
          event.stopPropagation();
          console.log(dp.dt)
          dp.opened = true; 
        };
        
        dp.clear = function () {
          dp.ngModel = null;
        };
        
      },
      bindToController: true,
      controllerAs: 'dp',
      templateUrl: '/assets/js/modules/bz-comp/datepicker-template.html'
    }
  })

  .directive('awDatepickerPattern',function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope,elem,attrs, ngModelCtrl) {
        var dRegex = new RegExp('^[0-3][0-9]-[0-1][0-9]-[1-2][0-9][0-9][0-9]$');

        ngModelCtrl.$parsers.unshift(function(value) {
          
          console.log(value);

          if (typeof value === 'string') {
            var isValid = dRegex.test(value);
            ngModelCtrl.$setValidity('date',isValid);
            if (!isValid) {
              return undefined;
            }
          }

          return value;
        });

      }
    };
  })

  .directive('textField', function() {
    return {
      replace: true,
      transclude: true,
      template: function (el, attr) {

        return '<div class="form-group">'+ 
                  '<label for="inputEmail3" class="col-sm-2 control-label">'+ attr.label + '</label>'+ 
                  '<div class="col-sm-10">' +  
                    '<input ng-transclude type="text" class="form-control" id="'+ attr.model +'" ng-model='+ attr.model +'>'+
                  '</div>' +
                '</div>';
      }
    };
  });

  angular.module('docsIsolateScopeDirective', ['bz.comp'])
  .controller('projectDetailsCtrl', ['$scope', function($scope) {
    $scope.people = [
          { name : "john", age: 24, work: "fish", id: 1 },
          { name : "lady", age: 23, work: "assasin", id: 2},
          { name : "bill", age: 24, work: "cook", id: 3},
          { name : "jane", age: 24, work: "hunter", id: 4}
        ];
    $scope.companies = [
          { name : "Allied", work: "Insurance Company"},
          { name : "Water Supply", work: "Water Supply Company"},
        ];
        
    $scope.formfields = {
      customers : $scope.people
    };
        
    
    $scope.logName = function () {
      console.log("loging name");
    };
  }])

})(window.angular);