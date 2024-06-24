using { sap.capire.bookshop as my } from '../db/schema';

service CatalogService {
  @(restrict: [{ grants: ['WRITE'], to: 'Admin' }])
  @readonly entity ListOfBooks as projection on Books
  excluding { descr };

  @(restrict: [{ grant: ['REAAD'], to: 'Admin' }])
  @readonly entity Books as projection on my.Books { *,
    author.$name as author
  } excluding { createdBy, modifiedBy };

  @requires: 'authenticated-user'
  action submitOrder ( book: Books:ID, quantity: Integer ) returns { stock: Integer };
  event OrderedBook : { book: Books:ID; quantity: Integer; buyer: String };
}