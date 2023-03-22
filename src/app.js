import angular from 'angular';
import templateUrl from './template.html';
import './style.css';

if (process.env.NODE_ENV !== 'production') console.log('[DEBUG] app is running in DEVELOPMENT MODE');
if (process.env.NODE_ENV === 'production') console.log('[DEBUG] app is running in PRODUCTION MODE');


const app = angular
	.module('example', [])
	.directive('myExampleDirective', ['$interval', ($interval) => {
		return {
			restrict: 'EA',
			templateUrl: templateUrl,
			link: (scope, element, attrs) => {

				// load moment.js
				require.ensure([], function (require) {
					let moment = require('moment');

					console.log('[DEBUG] moment.js was loaded...');

					$interval(() => {
							scope.time = moment().format('HH:mm:ss');
						}, 100,
					);
				});
			},
		}
	}]);