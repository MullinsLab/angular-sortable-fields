# Sortable fields

This is a generic [AngularJS][] component for maintaining the sort state of a
set of sortable fields.  A typical use case is making table rows sortable by
their column headers, but the component is not limited to that particular
usage.

It was originally written for our [TCozy][] application and then minimally
extracted to be reused in other projects of ours.

[AngularJS]: https://angularjs.org
[TCozy]: https://mullinslab.microbiol.washington.edu/tcozy/


## Usage

The primary directive is the attribute `sortable`, which instantiates a
SortableController on the element and publishes the controller into the
surrounding scope as `sortable`.  Initial sort state is taken from the
element’s `sort-state` attribute and bound to the controller’s `state`
property.  The state is an object containing at least two properties: `field`
and `order` (see example below).

The secondary directive is the attribute `sortable-field`, which must be on a
descendant element of a sortable element.  This attribute takes a string value
which names the field to sort by upon clicking the element.  Repeated clicks on
the element will toggle the sort direction, modifying the sort state of the
parent sortable controller using its `toggleSort()` method.  The first click on
a sortable field uses ascending sort order by default, but you may change this
by adding the `descending-first` attribute.

For convenient integration with [Angular’s orderBy filter][], the sortable
controller exposes an `orderBy` property which is an array suitable for
providing as the first argument to the orderBy filter (see example below).
When using this `orderBy` property, nulls and empty strings in the current sort
field are always forced to the end.

[Angular’s orderBy filter]: https://docs.angularjs.org/api/ng/filter/orderBy


## Example

A small example of markup using this component is below:

```html
<pre ng-init="cookie_jars = [{ name: 'Tom',  remaining_cookies: 3 },
                             { name: 'Evan', remaining_cookies: 1 },
                             { name: 'Jim',  remaining_cookies: 9 }]">
  {{ cookie_jars }}
</pre>
<table sortable sort-state="{ field: 'remaining_cookies', order: '-' }">
  <thead>
    <tr>
      <th sortable-field="name">Name of cookie jar owner</th>
      <th sortable-field="remaining_cookies">Number of cookies</th>
    </tr>
  </thead>
  <tbody>
    <tr ng-repeat="jar in cookie_jars | orderBy: sortable.orderBy">
      <td>{{ jar.name }}</td>
      <td>{{ jar.remaining_cookies | number: 0 }}</td>
    </tr>
  </tbody>
</table>
```

## Styling

This component doesn’t provide any default styling for your sortable fields, so
you will almost certainly want to add some yourself.  If you’re using
[Bootstrap 3][], you may want to look at the simple example styles provided by
the file [`sortable-fields-bootstrap.css`][].

[Bootstrap 3]: https://getbootstrap.com/docs/3.3/
[`sortable-fields-bootstrap.css`]: sortable-fields-bootstrap.css
