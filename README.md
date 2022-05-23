## Experimental rewrite of Isso client

This repo aims to provide a base for a more modular and better testable Isso
client.

*!!! BEWARE DRAGONS !!!*

### Try it

```console
$ npm install
$ npm run build
```

This will generate `embed.dev.js`.
Use `embed.dev.js` in place of the "stock" Isso client JS.

### Development

Make demo JS use new client in regular Isso repo:
```diff
diff --git a/isso/demo/index.html b/isso/demo/index.html
index 0b043e0..b731dcc 100644
--- a/isso/demo/index.html
+++ b/isso/demo/index.html
@@ -9,8 +9,8 @@
   <div id="wrapper" style="max-width: 900px; margin-left: auto; margin-right: auto;">
    <h2><a href="index.html">Isso Demo</a></h2>

-   <script src="../js/embed.dev.js"
-           data-isso="../"
+   <script src="http://localhost:8000/embed.dev.js"
+           data-isso="http://localhost:8080/"
            ></script>
    <!-- Uncomment to only test count functionality: -->
    <!-- <script src="../js/count.dev.js"></script> -->
```

Also, add a simple `/config` endpoint:
```diff
diff --git a/isso/views/comments.py b/isso/views/comments.py
index 4304692..54396d1 100644
--- a/isso/views/comments.py
+++ b/isso/views/comments.py
@@ -107,6 +107,7 @@ class API(object):
         ('dislike', ('POST', '/id/<int:id>/dislike')),
         ('demo', ('GET', '/demo')),
         ('preview', ('POST', '/preview')),
+        ('config', ('GET', '/config')),
         ('login', ('POST', '/login')),
         ('admin', ('GET', '/admin'))
     ]
@@ -1115,6 +1116,10 @@ class API(object):
 
         return JSON({'text': self.isso.render(data["text"])}, 200)
 
+    def config(self, environment, request):
+        rv = {'config': self.public_conf}
+        return JSON(rv, 200)
+
     def demo(self, env, req):
         return redirect(
             get_current_url(env, strip_querystring=True) + '/index.html'
```

Then spin up the server (from regular Isso repo):
```console
$ virtualenv .venv
$ source .venv/bin/activate
(.venv) $ pip install -e .
(.venv) $ isso -c share/isso-dev.cfg run
```

Fast auto-reloading:
```console
$ npm run watch
```

Serve the generated experimental client files at `localhost:8000` (from
this experimental client repo:
```console
$ cd dist && python3 -m http.server
```

### Explanation, sort of

**Btw, feedback appreciated!**

The aim is to modularize the client codebase and make it easier to test, as well
as make it a bit more clear to read and to avoid race conditions.

This code makes heavy use of class-like objects. It still only uses ES5 syntax
and strict mode. Prototyping and member functions are used heavily. A lot of
state is carried and passed. I'm not sure this is the right approach, but it
seems to work okay-ish so far.

Example, not sure if this an anti-pattern:

```javascript
var App = function(conf) {
  this.conf = conf;
}
App.prototype.initWidget = function() {
  var self = this; // Preserve App object instance context
  renderSomething(self.conf);
  // [...]
}

// later, in other file:
var app = new app.App();
app.initWidget()
```

I'm still also very unclear about scopes. Especially `this` and how it resolves
inside Object instances and through calls to prototyped-member functions.

### More access

The embed script now exposes the main `app` object as `window.Isso.unstableApp`:

```javascript
window.Isso = {
  init: init,
  fetchComments: fetchComments,
  count: count,
  registerExtensions: issoApp.registerExtensions,
  // Called "unstable" because app internals are subject to change!
  unstableApp: issoApp,
}
```
Called `unstableApp` because it should not be relied upon, but could still be
nice for testing or (unsafe) extensibility.

To prevent Isso from initializing fully and adding any elements to the page, set
`window.Isso.preventInit = true`. Then do any setup you require and call
`window.Isso.init()` and `fetchComments()` manually.

### Extensions

Now with extensions! See `extensions.js` and the `this.ext` attribute of `app`.

**Example:**

```javascript
var AuthExtension = function() {
  var addAuthHeader = function(xhr) {
    // read auth from somewhere...
    var authHeader = ["Auth-Foo", "foo"];
    // and add it to every XMLHttpRequest:
    xhr.setRequestHeader(authHeader[0], authHeader[1]);
  };
  this.hooks = {
    "api.curl.pre": [addAuthHeader],
  };
};

var auth = new AuthExtension();
window.Isso.Ext = {
  hooks: auth.hooks,
};
// Register manually:
window.Isso.registerExtensions();
```

Now, every call to `api.curl` will have the `XMLHttpRequest`(`xhr`) object
modified with an added authentication header `Auth-Foo = foo`.

N.b.: If `window.Isso.Ext` (with hooks set) is already defined when Isso is
loaded (e.g. in SPAs), Isso will automatically call `registerHooks()` itself.
