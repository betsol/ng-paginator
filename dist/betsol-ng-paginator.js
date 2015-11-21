/**
 * betsol-ng-paginator - Paginator for Angular.js
 * @version v0.0.3
 * @link https://github.com/betsol/ng-paginator
 * @license MIT
 *
 * @author Slava Fomin II <s.fomin@betsol.ru>
 */
(function (window, angular) {

  'use strict';

  angular.module('betsol.paginator', [])

    .factory('Paginator', function () {

      return function (requestInitiator) {

        var initialized = false;
        var list = [];
        var offset = 0;
        var itemsPerPage = null;
        var criteria = {};
        var sortParams = null;
        var total = null;
        var hasMoreItems = null;
        var clearPending = false;
        var loading = false;
        var loadEventListener = null;
        var debug = false;


        return {
          list: list,
          hasMoreItems: function () {
            return hasMoreItems;
          },
          isLoading: function () {
            return loading;
          },
          setItemsPerPage: function (newItemsPerPage) {
            itemsPerPage = newItemsPerPage;
            return this;
          },
          setCriteria: function (newCriteria) {
            if (!angular.equals(criteria, newCriteria)) {
              softReset();
            }
            criteria = newCriteria;
            return this;
          },
          setSorting: function (newSortParams) {
            if (!angular.equals(sortParams, newSortParams)) {
              softReset();
            }
            sortParams = newSortParams;
            return this;
          },
          first: function () {
            if (loading) {
              return null;
            }
            hasMoreItems = null;
            softReset();
            return loadAndAdvance();
          },
          next: function () {
            if (loading) {
              return null;
            }
            return loadAndAdvance();
          },
          addLoadEventListener: function (listener) {
            if ('function' !== typeof listener) {
              console.log('Specified event listener must be a function.');
              return;
            }
            loadEventListener = listener;
          },
          getItemsCount: function () {
            return this.list.length;
          },
          isEmptyResult: function () {
            return (initialized && !loading && 0 == this.list.length);
          }
        };


        /**
         * Clears the list.
         */
        function clear () {
          truncateArray(list);
          clearPending = false;
          addLog('List is cleared');
        }

        function reset () {
          softReset();
          clear();
        }

        /**
         * Resets internal pointer to the beginning of the list.
         * List will be repopulated on next load.
         */
        function softReset () {
          offset = 0;
          total = null;
          clearPending = true;
        }

        /**
         * Loads next batch of items and returns number of loaded items.
         */
        function load () {

          loading = true;

          addLog('Loading batch of items', {
            criteria: criteria,
            itemsPerPage: itemsPerPage,
            offset: offset
          });

          return requestInitiator(criteria, itemsPerPage, offset, sortParams)
            .then(function (response) {

            // Checking if response contains data.
            if ('undefined' === typeof response.data) {
              console.log('Missing data from loader\'s response.');
              return;
            }

            // Handling total.
            if (null === total) {
              if ('undefined' === typeof response.meta) {
                console.log('Missing meta from loader\'s response.');
                return;
              }
              if ('undefined' === typeof response.meta.pagination) {
                console.log('Missing pagination from loader\'s response.');
                return;
              }
              if ('undefined' === typeof response.meta.pagination.totalCount) {
                console.log('Missing total from loader\'s response.');
                return;
              }
              total = parseInt(response.meta.pagination.totalCount);
              addLog('Total is set', total);
            }

            // Clearing list before new items are added to it.
            if (clearPending) {
              clear();
            }

            // Adding loaded items to the list.
            angular.forEach(response.data, function (item) {
              list.push(item);
            });

            loading = false;

            if (!initialized) {
              initialized = true;
              addLog('Storage is now initialized');
            }

            // Calling event listener.
            if (loadEventListener) {
              loadEventListener(response);
            }

            var loadedItemsCount = response.data.length;

            addLog('Items loaded (count)', loadedItemsCount);

            // Returning number of loaded items;
            return loadedItemsCount;

          });
        }

        /**
         * Loads next batch of items and advances internal pointer.
         */
        function loadAndAdvance () {
          if (false === hasMoreItems) {
            return;
          }
          return load().then(function (loadedCount) {
            offset += loadedCount;
            hasMoreItems = (total - (offset + 1) >= 0);
            addLog('New offset calculated', offset);
          });
        }

        function addLog () {
          if (debug) {
            console.log.apply(console, arguments);
          }
        }

      };
    })
  ;


  /**
   * Removes all items from the existing array preserving the original reference.
   *
   * @param array
   */
  function truncateArray (array) {
    while (array.length > 0) {
      array.pop();
    }
  }

})(window, angular);
