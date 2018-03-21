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
 *  <table sortable sort-state="[{ field: 'remaining_cookies', order: '-' }]">
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
        state: '=?sortState',
        allowMultiple: '=?sortByMultiple'
      },
      scope: true
    };
  }


  sortableController.$inject = ['$scope', '$parse', '$log'];

  function sortableController($scope, $parse, $log) {
    this.fields = new Map();

    // Watch sort state and update as necessary
    $scope.$watch(
      () => this.state,
      () => { this.update() },
      true
    );

    this.$onInit = function() {
      if (!this.state)
        this.state = [];

      this.update();
    };

    // Update orderBy property and sort field display classes.
    this.update = function() {
      function orderBy(state) {
        if (!state)
          return [];

        let getFieldValue = $parse(state.field);

        return [
          // Always sort null, empty, and NaN values to the end.  This could be
          // made optional or configurable in the future.
          (item) => {
            let v = getFieldValue(item);
            return v == null || v === '' || Number.isNaN(v);
          },

          // Primary user-toggleable sort column
          state.order + state.field
        ];
      }

      // Build orderBy
      this.orderBy =
        this.state
          .map(orderBy)
          .reduce((a,b) => a.concat(b), []);

      // Sync display state of every field
      this.fields.forEach(field => { this.updateField(field) });
    };

    // Add/remove classes based on the current sort state
    this.updateField = function(field) {
      let state       = this.fieldState(field.field),
          sortedField = !!state;
      field.element.classList.toggle("sorted",     sortedField);
      field.element.classList.toggle("ascending",  sortedField && state.order === "+");
      field.element.classList.toggle("descending", sortedField && state.order === "-");
    };

    // Register sort field
    this.register = function(element, field, descendingFirst) {
      this.fields.set(field, { element, field, descendingFirst });

      // Clicking toggles the sort
      element.addEventListener("click", () => {
        $scope.$apply(() => {
          this.toggleSort(field);
        });
      }, false);

      // Initialize display state
      this.updateField( this.fields.get(field) );
    };

    // Toggle sort field
    this.toggleSort = function(name) {
      let field = this.fields.get(name),
          state = this.fieldState(name);

      if (!state) {
        let initialState = {
          field: field.field,
          order: field.descendingFirst ? "-" : "+"
        };

        if (this.allowMultiple)
          this.state.push(initialState);
        else
          this.state = [ initialState ];
      }
      else {
        switch (state.order + state.field) {
          case "-" + field.field:
            if (field.descendingFirst)
              state.order = "+";
            else
              this.state.splice(this.state.indexOf(state), 1);
            break;

          case "+" + field.field:
            if (!field.descendingFirst)
              state.order = "-";
            else
              this.state.splice(this.state.indexOf(state), 1);
            break;

          default:
            throw "Unexpected state! " + JSON.stringify(state)
        };
      }
    };

    // Helper for finding field state, if any
    this.fieldState = function(name) {
      if (this.state)
        return this.state.filter(x => x.field === name)[0];
      else
        return null;
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
