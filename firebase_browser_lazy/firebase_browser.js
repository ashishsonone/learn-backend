'use strict';

var app = angular.module('firebaseApp', []);
app.controller('BrowserController', ['$scope', function($scope){
      // A $( document ).ready() block.
      $scope.BASE_URL = "https://dev-preppo.firebaseio.com";
      $scope.breadcrumbs = [{name : "ROOT", url : "/"}];
      $scope.notification = "None";
      $scope.fbKeys = [];
      $scope.showLoading = true;
      $scope.showNotification = false;
      $scope.notification = "An error occured while loading data. Try clicking on breadcrumb";
  
      $scope.expand = function(key){
        var lastIndex = $scope.breadcrumbs.length-1;
        var crumb = {name : key, url : $scope.breadcrumbs[lastIndex].url + key + "/"};
        $scope.breadcrumbs.push(crumb);
        $scope.loadData(crumb);
      }
      
      $scope.contract = function(crumb){
        var index = 0;
        for(var i=0; i<$scope.breadcrumbs.length; i++){
          var c = $scope.breadcrumbs[i];
          if(c.url === crumb.url){
            index = i;
          }
        }
        
        $scope.breadcrumbs = $scope.breadcrumbs.slice(0, index+1);//remove remaining elements
        $scope.loadData(crumb);
      }
      
      $scope.loadData = function(crumb){
        var shallowUrl = $scope.BASE_URL + crumb.url + ".json" + "?shallow=true";
        $scope.showLoading = true;
        $.ajax(shallowUrl, {
          success: function(data) {
            console.log("success for url=" + shallowUrl);
            console.log("data type----> " + typeof(data));
            var keys = [];
            if(typeof(data) != 'object'){ //number or string
              console.log("pushed a number/string " + data);
              keys.push(data);
            }
            else{
              var count = 0;
              for(var k in data){
                //console.log("pushing " + k);
                keys.push(k);
                count++;
              }
              console.log("pushed " + count + " keys");
            }
            
            $scope.fbKeys = keys;
            $scope.showNotification = false;
            $scope.showLoading = false;
            console.log($scope.fbKeys);
            $scope.$apply();
          },
          error: function() {
            console.log("error occured");
            $('#data').html('An error occurred');
            $scope.showLoading = false;
            $scope.showNotification = true;
            $scope.$apply();
          }
        });
      }
      
      //init load data for root
      $scope.loadData($scope.breadcrumbs[0]);
}]);