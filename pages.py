#!/usr/bin/env python
#
# Pages for gphysicians app

import jinja2
import os
import webapp2

import decorators

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(
        os.path.join(os.path.dirname(__file__), "templates")),
    extensions=["jinja2.ext.autoescape"],
    autoescape=True)

def render_template(name):
    template = JINJA_ENVIRONMENT.get_template(name)
    return template.render({})

class FrontPage(webapp2.RequestHandler):
    @decorators.check_authorization
    def get(self):
        self.response.write(render_template("front.html"))

class SearchPage(webapp2.RequestHandler):
    @decorators.check_authorization
    def get(self):
        self.response.write(render_template("search.html"))

app = webapp2.WSGIApplication([("/", FrontPage),
                               ("/search", SearchPage)])
