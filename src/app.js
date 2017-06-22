import angular from 'angular';
import templateUrl from './template.html';
import './style.css';

console.log('App is running...');

console.log(process.env);

const app = angular
		.module('example', [])
		.directive('myExampleDirective', ($interval) => {
			return {
				restrict: 'EA',
				templateUrl: templateUrl,
				link: (scope, element, attrs) => {

					// load moment.js
					require.ensure([], function (require) {
						let moment = require('moment');

						console.log('moment.js was loaded...');

						$interval(() => {
									scope.time = moment().format("HH:mm:ss");
								}, 100
						);
					});
				}
			}
		});