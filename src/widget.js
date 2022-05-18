/*
Uses:
- DOM/jquery $ impl
  -> functional
- utils
  -> functional
- identicons
  -> functional
- globals
  -> stateful
- template
  -> dependent on i18n+conf
- config
  -> data-isso-* attrs, enriched with conf fetched from server (catch-22)
- api
  -> dependent on data-isso-* attrs, stateful
- i18n
  -> dependent on language selection+conf

One-time setup:

Functions:

Functions (DOM-dependent):

Functions (dependent on config):
*/
