# ChangeLog

- **Version 1.1.0**
  - Add ability to `emitAndWait` (emit an event and wait for a response).
  - `emit` now returns the _"full"_ payload (with real `_metas` sent to event)
  - Add ability to define (or override) some values in `_metas` when emitting.
