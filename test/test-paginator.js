describe('Paginator', function () {

  //===========//
  // TEST DATA //
  //===========//

  var testData = {
    criteria: {
      foo: 'FOO',
      bar: 'BAR'
    },
    totalCount: 23,
    backendItemsList: []
  };

  for (var i = 0; i < testData.totalCount; i++) {
    testData.backendItemsList.push({
      id: i + 1
    });
  }


  //==============//
  // INITIALIZING //
  //==============//

  var Paginator;
  var $rootScope;
  var initiatorMock;
  var paginator;

  beforeEach(function () {
    module('betsol.paginator');
  });

  beforeEach(inject(function ($injector) {

    var $q = $injector.get('$q');

    Paginator = $injector.get('Paginator');
    $rootScope = $injector.get('$rootScope');

    // Request initiator mock.
    initiatorMock = sinon.spy(function (criteria, count, offset) {
      return $q(function (resolve) {
        resolve({
          data: testData.backendItemsList.slice(offset, offset + count),
          meta: {
            pagination: {
              totalCount: testData.totalCount
            }
          }
        });
      });
    });

    paginator = new Paginator(initiatorMock);

  }));

  //=========//
  // TESTING //
  //=========//

  it('constructor should be present', function () {
    expect(Paginator).to.be.a('function');
  });

  it('creates a valid instance', function () {
    expect(paginator).to.be.an('object');
    expect(paginator.list).to.be.an('array');
    expect(paginator.hasMoreItems).to.be.a('function');
    expect(paginator.isLoading).to.be.a('function');
    expect(paginator.setItemsPerPage).to.be.a('function');
    expect(paginator.setCriteria).to.be.a('function');
    expect(paginator.first).to.be.a('function');
    expect(paginator.next).to.be.a('function');
    expect(paginator.addLoadEventListener).to.be.a('function');
    expect(paginator.getItemsCount).to.be.a('function');
    expect(paginator.isEmptyResult).to.be.a('function');
  });

  it('request initiator is called with correct arguments', function () {
    paginator
      .setCriteria(testData.criteria)
      .setItemsPerPage(10)
    ;

    paginator.first();
    $rootScope.$digest();
    expect(initiatorMock.calledWith(testData.criteria, 10, 0)).to.be(true);

    paginator.next();
    $rootScope.$digest();
    expect(initiatorMock.calledWith(testData.criteria, 10, 10)).to.be(true);
  });

  it('request initiator is called correct number of times', function () {
    paginator.setItemsPerPage(10);

    // 1 .. 10
    paginator.first();
    $rootScope.$digest();
    expect(paginator.hasMoreItems()).to.be(true);
    expect(initiatorMock.callCount).to.be(1);

    // 10 .. 20
    paginator.next(); // 10 .. 20
    $rootScope.$digest();
    expect(paginator.hasMoreItems()).to.be(true);
    expect(initiatorMock.callCount).to.be(2);

    // 20 .. 23
    paginator.next(); // 20 .. 23
    $rootScope.$digest();
    expect(paginator.hasMoreItems()).to.be(false);
    expect(initiatorMock.callCount).to.be(3);

    // No more items to query for
    paginator.next();
    $rootScope.$digest();
    expect(initiatorMock.callCount).to.be(3);
  });

});
