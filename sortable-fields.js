/*
 * This is a generic module for maintaining sort state.
 *
 * The primary directive is the attribute "sortable", which instantiates a
 * SortableController on the element and publishes the controller into the
 * surrounding scope as "sortable".  Initial sort state is taken from the
 * element's "sort-state" attribute and bound to the controller's "state"
 * property.
 *
 * The secondary directive is the attribute "sortable-field", which must be on
 * a descendant element of a sortable element.  This attribute takes a string
 * value which names the field to sort by upon clicking the element.  Repeated
 * clicks on the element will toggle the sort direction, modifying the sort
 * state of the parent sortable controller using its toggleSort() method.  The
 * first click on a sortable field uses ascending sort order by default, but
 * you may change this by adding the "descending-first" attribute.
 *
 * For convenient integration with Angular's orderBy filter, the sortable
 * controller exposes an "orderBy" property which is an array suitable for
 * providing as the first argument to the orderBy filter (see example below).
 * When using this "orderBy" property, nulls and empty strings in the current
 * sort field are always forced to the end.
 *
 * A small example:
 *
 *  <pre ng-init="cookie_jars = [{ name: 'Tom',  remaining_cookies: 3 },
 *                               { name: 'Evan', remaining_cookies: 1 },
 *                               { name: 'Jim',  remaining_cookies: 9 }]">
 *    {{ cookie_jars }}
 *  </pre>
 *  <table sortable sort-state="{ field: 'remaining_cookies', order: '-' }">
 *    <thead>
 *      <tr>
 *        <th sortable-field="name">Name of cookie jar owner</th>
 *        <th sortable-field="remaining_cookies">Number of cookies</th>
 *      </tr>
 *    </thead>
 *    <tbody>
 *      <tr ng-repeat="jar in cookie_jars | orderBy: sortable.orderBy">
 *        <td>{{ jar.name }}</td>
 *        <td>{{ jar.remaining_cookies | number: 0 }}</td>
 *      </tr>
 *    </tbody>
 *  </table>
 *
 */
(function(){
  'use strict';

  angular
    .module('sortable-fields', [])
    .directive('sortable', sortable)
    .directive('sortableField', sortableField);


  sortable.$inject = ['$log'];

  function sortable($log) {
    return {
      restrict: 'A',
      controller: sortableController,
      controllerAs: 'sortable',
      bindToController: {
        state: '=sortState'
      },
      scope: true
    };
  }


  sortableController.$inject = ['$scope', '$parse', '$log'];

  function sortableController($scope, $parse, $log) {
    this.fields = [];

    // Watch sort state and update orderBy property and sort state display classes.
    $scope.$watch(
      () => this.state,
      () => {
        var getFieldValue = $parse(this.state.field);

        this.orderBy = [
          // Always sort null, empty, and NaN values to the end.  This could be
          // made optional or configurable in the future.
          (item) => {
            let v = getFieldValue(item);
            return v == null || v === '' || Number.isNaN(v);
          },

          // Primary user-toggleable sort column
          this.state.order + this.state.field
        ];

        // Add/remove classes based on the current sort state
        this.fields.forEach(field => {
          let sortedField = this.state && this.state.field === field.field;
          field.element.classList.toggle("sorted",     sortedField);
          field.element.classList.toggle("ascending",  sortedField && this.state.order === "+");
          field.element.classList.toggle("descending", sortedField && this.state.order === "-");
        });
      },
      true
    );

    // Register sort field
    this.register = function(element, field, descendingFirst) {
      this.fields.push({ element, field });

      // Clicking toggles the sort
      element.addEventListener("click", () => {
        $scope.$apply(() => {
          this.toggleSort(field, descendingFirst);
        });
      }, false);
    };

    // Toggle sort field
    this.toggleSort = function(field, descendingFirst) {
      switch (this.state.order + this.state.field) {
        case "-" + field:
          this.state.order = "+";
          break;
        case "+" + field:
          this.state.order = "-";
          break;
        default:
          this.state = { field: field, order: descendingFirst ? "-" : "+" };
          break;
      };
    };
  }


  sortableField.$inject = ['$log'];

  function sortableField($log) {
    return {
      restrict: 'A',
      require: '^^sortable',
      scope: {
        field: '@sortableField'
      },
      link: function (scope, element, attrs, ctrl) {
        element = element[0];

        $log.debug("Activating sortable column: ", element);

        ctrl.register(element, scope.field, "descendingFirst" in attrs);
      }
    };
  }

})();