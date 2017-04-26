import angular from 'angular';
import './jQuery.plugin.js';
import templateUrl from './template.html';
import './style.css';

console.log('App is running...');

const app = angular
    .module('example', [])
    .directive('myExampleDirective', () => {
    return {
        restrict: 'EA',
        templateUrl : templateUrl,
        link: (scope, element, attrs) => {

            // load moment.js
            require.ensure([], function(require) {
                let moment = require('moment');

                console.log('moment.js was loaded...');

                 scope.$apply(() => {
                    scope.time = moment().fromNow();
                 })
                
            });            
        }
    }
  });