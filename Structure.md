# Application structure and flow

```
├── app
│     ├── api.js
│     ├── config.js
│     ├── count.js
│     ├── dom.js
│     ├── globals.js
│     ├── i18n
│     │     ├── en.js
│     ├── i18n.js
│     ├── isso.js
│     ├── lib
│     │     ├── identicons.js
│     │     ├── promise.js
│     │     └── ready.js
│     ├── svg
│     │     ├── arrow-down.svg
│     │     └── arrow-up.svg
│     ├── svg.js
│     ├── template.js
│     ├── templates
│     │     ├── comment.js
│     │     ├── comment-loader.js
│     │     └── postbox.js
│     └── utils.js
├── embed.js
```

`'use strict';` -> should be handled by webpack, no need to put in every file
header
