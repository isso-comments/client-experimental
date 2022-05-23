# Application structure and flow

```
- embed
    -> app
      -> postbox
      -> comment
      -> extensions
      -> [api, config, i18n, offset, svg, template, utils]
  -> counter
- count
  -> counter
```

# Specifics

### Syntax

`'use strict';` -> should be handled by webpack, no need to put in every file
header

# TODO
- Handle multiple invications of `init()` -> should be idempotent
  (we assume config will not change and thus we should not re-initialize the
  postbox element)
- i18n fetching on demand, do reduce bundle size?
- Simplifying, less boilerplate classes, move initializers inside constructors
  (can do `new App` and not initialize it to still mock without instance data,
  use prototype funcs independently during testing)
- Figure out performance issues and repainiting jank (how to profile?)
- Further removing DOM dependence
- Clean up usage of `this` (`self`) and figure out better ways to keep state
- Make custom promise lib more testable (use drop-in fixture without setTimeout,
  find out more about setTimeout)
- Figure out deep mocking: How deep does Jest mock? Also inside deps of deps?
  - also, instance vs module (proto) mocking
- `initWidget` should have some different control flow
  (root cause is that fetching config should be more or less blocking since
  everything afterwards needs to rely on it)
- Figure out a way for dynamically re-initializing, based on listeners for
  changed configs?
- Clean up event listeners (and setTimeout usage)
- Clean up app elements when DOM node is removed
- Centralized failure/error aggregation, reporting
  - where should errors appear? error inside postbox under reply should get
    back there and not to the top-level postbox
  - show validation errors inline (for single input elements like author, email,
    website)
  - show validation errors earlier: when focus gone, not just on submit
  - validation errors:
    - missing, but required
    - too short
    - wrong format
  - copy validation of email+website format from server to save a roundtrip
- Sorting based on date, votes -> requires keeping track of children, maybe
  remove, re-order and then re-insert or figure out a way for re-ordering
  children from DOM functions
  - figure out if child comments should also be sorted (I think they shouldn't)
- aggregate requests in some way
  (too many requests, even during init: /config, /, /count)
- Let /count reply with a dict, not array (which requires keeping track of array
  position mapping to urls)
- Create a command + endpoint on server for dropping and re-initializing db
  (guarded by DEBUG flag in conf or env?)
- Using max-age or expires for cookies instead of polling -> would require to
  keep track of those as expiration is not available through standard JS,
  CookieStore API to retrieve info not widely available, and keeping track
  locally would require localstorage or to modify cookie to store its own
  expiration somehow... maybe server can figure out expiration and sign it
- Only have one place for figuring out thread id instead of doing
  `getAttribute('data-isso-id') || getLocation()` all the time


### Splitting init and fetchComments

Is the split into `init` and `fetchComments` really necessary?

`fetchComments` relies on config that is only available once `init` is done

From docs, current state:

```rst
Asynchronous comments loading
-----------------------------

Isso will automatically fetch comments after `DOMContentLoaded` event. However
in the case where your website is creating content dynamically (eg. via ajax),
you need to re-fetch comment thread manually. Here is how you can re-fetch the
comment thread:

.. code-block:: js

    window.Isso.fetchComments()

It will delete all comments under the thread but not the PostBox, fetch
comments with `data-isso-id` attribute of the element `section#isso-thread` (if
that attribute does not exist, fallback to `window.location.pathname`), then
fill comments into the thread. In other words, you should change `data-isso-id`
attribute of the element `section#isso-thread` (or modify the pathname with
`location.pushState`) before you can get new comments. And the thread element
itself should *NOT* be touched or removed.

If you removed the `section#isso-thread` element, just create another element
with same TagName and ID in which you wish comments to be placed, then call the
`init` method of `Isso`:

.. code-block:: js

    window.Isso.init()

Then Isso will initialize the comment section and fetch comments, as if the page
was loaded.
```

-> The statement that `init()` will call `fetchComments` is false in current stock Isso code!
