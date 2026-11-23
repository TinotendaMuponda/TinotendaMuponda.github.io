'use strict';
// This page never consumes authentication credentials. Remove old provider-link fragments/queries
// from the visible URL without loading another page or sending them anywhere.
history.replaceState(null, '', location.pathname);
