#!/usr/bin/env python
#
# JSON APIs for gphysicians app

import json
import webapp2

from google.appengine.ext import db

import cse_api_client

PINS = [
    "2100", # Errol
    "2101", # Uri
    "2102", # Jeff
    "2103", # Mark
    "2106", # chauhanv@stanford.edu
    "2107", # fang.danielz@gmail.com
    "2108", # lancedowning@gmail.com
    "2109", # guson.kang@gmail.com
    "2110", # stun@stanford.edu
    "2111", # kelsey.flint@gmail.com
    "2112", # conn.chen@gmail.com
    "2113", # akumar3@stanford.edu
    "2114", # ghulley@stanford.edu
    "2115", # rperumpail@gmail.com
    "2116", # ajphadke@stanford.edu
    "2117", # priquelm@stanford.edu
    "2118", # katz.annie@gmail.com
    "2119", # rshuss@gmail.com
    "2120", # mamic@stanford.edu
    "2121", # tlew@stanford.edu
    "2122", # longnguyen07@gmail.com
    "2123", # ghenders@stanford.edu
    "2124", # mikelin@stanford.edu
    "2125",
    "2126",
    "0987"  # mwytock/testing
]

# models
class QueryLogEntry(db.Model):
    query = db.StringProperty()
    date = db.DateTimeProperty(auto_now_add=True)

# NOTE(mwytock): These are really deltas representing the labeling actions
class Label(db.Model):
    timestamp = db.DateTimeProperty(auto_now_add=True)
    url = db.StringProperty()
    add = db.StringListProperty()
    remove = db.StringListProperty()
    mode = db.CategoryProperty(choices=("page", "site"))
    pin = db.StringProperty()

# handlers
class LogApi(webapp2.RequestHandler):
    def post(self):
        log_entry = QueryLogEntry(query=self.request.get("q"))
        log_entry.put()


class AllQueries(webapp2.RequestHandler):
    def get(self):
        self.response.headers["Content-type"] = "text/text"
        q = db.Query(QueryLogEntry).order("-date")

        seen_queries = {}
        for log_entry in q.run(limit=10000):
            if log_entry.query in seen_queries:
                continue
            self.response.out.write(log_entry.query + "\n")
            seen_queries[log_entry.query] = True


class RecentApi(webapp2.RequestHandler):
    def get(self):
        q = db.Query(QueryLogEntry).order("-date")

        seen_queries = {}
        recent = []
        for log_entry in q.run(limit=1000):
            if log_entry.query in seen_queries:
                continue
            recent.append({"query": log_entry.query})
            seen_queries[log_entry.query] = True
            if (len(seen_queries) > 30) :
                break

        self.response.headers["Cache-control"] = "no-store"
        self.response.headers["Content-type"] = "application/json"
        self.response.out.write(json.dumps({"recent": recent}))

class LabelApi(webapp2.RequestHandler):
    def post(self):
        # TODO(mwytock): Check the pin number
        if not self.request.get("pin") in PINS:
            self.response.set_status(403)
            return

        label = Label(url=self.request.get("url"),
                      add=self.request.get_all("add"),
                      remove=self.request.get_all("remove"),
                      mode=self.request.get("mode"),
                      pin=self.request.get("pin"))
        label.put()
        cse_api_client.add_remove_labels(label)


app = webapp2.WSGIApplication([("/api/log", LogApi),
                               ("/api/recent", RecentApi),
                               ("/api/allQueries", AllQueries),
                               ("/api/label", LabelApi)])
