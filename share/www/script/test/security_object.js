// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License.  You may obtain a copy
// of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
// License for the specific language governing permissions and limitations under
// the License.

couchTests.security_object = function(debug) {
  var usersDb = new CouchDB("test_suite_users", {"X-Couch-Full-Commit":"false"});
  var secretDb = new CouchDB("test_suite_db", {"X-Couch-Full-Commit":"false"});

  if (debug) debugger;

  function assertHasAccess() {
    try {
      secretDb.getSecObj();
      T(true && "admin user has access to security object");
    } catch(e) {
      T(false && "admin user has no access to security object");
    }
  }

  function assertHasNoAccess() {
    try {
      secretDb.getSecObj();
      T(false && "unautorized access to security object");
    } catch(e) {
      T(true && "no unautorized access to security object");
    }
  }

  function testFun() {
    try {
      usersDb.deleteDb();

      try {
        usersDb.createDb();
      } catch(e) {
        if (usersDb.last_req.status != 412) {
         throw e;
        }
      }

      secretDb.deleteDb();
      secretDb.createDb();
      secretDb.save({_id: "baz", foo: "bar"});

      usersDb.save(
        CouchDB.prepareUserDoc({
          name: "user1@apache.org",
          roles : ["top-secret"]
        }, "funnybone")
      );

      usersDb.save(
        CouchDB.prepareUserDoc({
          name: "user2@apache.org"
        }, "secret")
      );

      usersDb.ensureFullCommit();

      secretDb.setSecObj({
        "members" : {
          roles : ["top-secret"],
          names : ["user1@apache.org"]
        }
      });
      CouchDB.login("user1@apache.org", "funnybone");
      assertHasNoAccess();

      CouchDB.logout();
      secretDb.setSecObj({
        "members" : {
          roles : [],
          names : []
        }
      });
      CouchDB.login("user1@apache.org", "funnybone");
      assertHasNoAccess();

      CouchDB.logout();
      secretDb.setSecObj({
        "admins" : {
          roles : ["top-secret"],
          names : []
        }
      });
      CouchDB.login("user1@apache.org", "funnybone");
      assertHasAccess();

      CouchDB.logout();
      secretDb.setSecObj({
        "admins" : {
          roles : [],
          names : ["user1@apache.org"]
        }
      });
      CouchDB.login("user1@apache.org", "funnybone");
      assertHasAccess();

      CouchDB.logout();

      secretDb.setSecObj({
        "admins" : {
          roles : ["top-secret"],
          names : ["user1@apache.org"]
        }
      });
      CouchDB.login("user2@apache.org", "secret");
      assertHasNoAccess();

      CouchDB.logout();
      secretDb.setSecObj({
        "admins" : {
          roles : [],
          names : []
        }
      });
      CouchDB.login("user2@apache.org", "secret");
      assertHasNoAccess();

      CouchDB.logout();
      secretDb.setSecObj({
        "members" : {
          roles : ["top-secret"],
          names : ["user1@apache.org"]
        }
      });
      CouchDB.login("user2@apache.org", "secret");
      assertHasNoAccess();

      CouchDB.logout();
      secretDb.setSecObj({
        "members" : {
          roles : [],
          names : []
        }
      });
      CouchDB.login("user2@apache.org", "secret");
      assertHasNoAccess();
    } finally {
      CouchDB.logout();
      usersDb.deleteDb(); // cleanup
    }
  }

  run_on_modified_server(
    [{section: "couch_httpd_auth",
      key: "iterations", value: "1"},
     {section: "couch_httpd_auth",
      key: "authentication_db", value: usersDb.name}],
    testFun
  );
};
