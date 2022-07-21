const handlersPerType = new Map();

export default {
  $on(eventType, handler) {
    const handlers = handlersPerType.get(eventType);
    if (handlers == null) {
      handlersPerType.set(eventType, [handler]);
    } else {
      handlers.push(handler);
    }
  },

  $emit(eventType, event) {
    const handlers = handlersPerType.get(eventType);
    if (handlers != null) {
      handlers.forEach((handler) => {
        handler(event);
      });
    }
  },
};
