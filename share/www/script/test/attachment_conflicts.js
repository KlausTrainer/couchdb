// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

// Do some edit conflict detection tests for attachments.
couchTests.attachment_conflicts = function(debug) {

  var dbA = new CouchDB("test_suite_db_a", {"X-Couch-Full-Commit":"false"});
  var dbB = new CouchDB("test_suite_db_b", {"X-Couch-Full-Commit":"false"});
  dbA.deleteDb();
  dbA.createDb();
  dbB.deleteDb();
  dbB.createDb();

  if (debug) debugger;

  T(dbA.save({"_id":"doc", "foo":"bar"}).ok);
  T(dbB.save({"_id":"doc", "foo":"baz"}).ok);

  // create conflict
  T(CouchDB.replicate("test_suite_db_a", "test_suite_db_b").ok);
  var doc = dbB.open("doc", {conflicts: true});
  var rev11 = doc._rev;
  var rev12 = doc._conflicts[0];

  // the attachment
  var bin_data = "JHAPDO*AU£PN ){(3u[d 93DQ9¡€])}    ææøo'∂ƒæ≤çæππ•¥∫¶®#†π¶®¥π€ª®˙π8np";

  // test that we can can attach to conflicting documents
  var xhr = CouchDB.request("PUT", "/test_suite_db_b/doc/attachment.txt", {
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
      "If-Match": rev11
    },
    body: bin_data
  });
  T(xhr.status == 201);
  var rev21 = JSON.parse(xhr.responseText).rev;
  var xhr = CouchDB.request("PUT", "/test_suite_db_b/doc/attachment.txt", {
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
      "If-Match": rev12
    },
    body: bin_data
  });
  T(xhr.status == 201);
  var rev22 = JSON.parse(xhr.responseText).rev;

  // trying to attach something to an old revision must result in error code 409
  var xhr = CouchDB.request("PUT", "/test_suite_db_b/doc/attachment_1.0.txt", {
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
      "If-Match": rev11
    },
    body: bin_data
  });
  T(xhr.status == 409);
  var xhr = CouchDB.request("PUT", "/test_suite_db_b/doc/attachment_1.0.txt", {
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
      "If-Match": rev11
    },
    body: bin_data
  });
  T(xhr.status == 409);

  // delete conflicting version
  var xhr = CouchDB.request("DELETE", "/test_suite_db_b/doc?rev=" + rev21);
  T(xhr.status == 200);
  // and test that we still can attach to the remaining version
  var xhr = CouchDB.request("PUT", "/test_suite_db_b/doc/attachment_2.0.txt", {
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
      "If-Match": rev22
    },
    body: bin_data
  });
  T(xhr.status == 201);
};
