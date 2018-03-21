/*
 * Please see the accompanying README.md for usage information.
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
    this.register = function(element, field, descendingFirst, label) {
      this.fields.set(field, { element, field, descendingFirst, label });

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

        ctrl.register(
          element,
          scope.field,
          "descendingFirst" in attrs,
          "fieldLabel" in attrs
            ? attrs.fieldLabel
            : element.textContent
        );
      }
    };
  }

})();
